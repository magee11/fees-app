import { useState } from 'react';
import { Search, X, Printer, Download } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { PageLoader } from '../components/PageLoader';
import { useToast } from '../context/ToastContext';
import { useStudent, useStudentMonthlyStatus, useStudents } from '../hooks/queries/useStudents';
import { useCreatePayment } from '../hooks/queries/usePayments';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatCurrency } from '../utils/currency';
import { gradientForId } from '../utils/gradient';
import { monthName } from '../utils/months';
import { triggerBlobDownload, openBlobInNewTab } from '../utils/download';
import { ApiError } from '../api/client';
import * as paymentsApi from '../api/payments';
import type { MonthStatus, PaymentDTO, PaymentMode } from '../types/api';

const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'Card', 'Bank'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export function Payments() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [lateFee, setLateFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [reference, setReference] = useState('');
  const [lastPayment, setLastPayment] = useState<PaymentDTO | null>(null);
  const { showToast } = useToast();

  const search = useDebouncedValue(searchInput, 350);
  const { data: searchResp } = useStudents({ search, limit: 8 }, search.trim().length > 0);
  // Gate on the immediate (un-debounced) input, not just result count: with
  // placeholderData: keepPreviousData, a disabled/cleared query keeps returning the
  // previous search's results as placeholder data, so results.length alone never
  // goes back to 0 right after picking a student and clearing the box.
  const searchResults = searchInput.trim().length > 0 ? (searchResp?.data ?? []) : [];

  const { data: selectedStudent } = useStudent(selectedStudentId);
  const { data: monthlyStatus } = useStudentMonthlyStatus(selectedStudentId, year, !!selectedActivityId);
  const activityStatus = monthlyStatus?.find((m) => m.activityId === selectedActivityId);
  const createPayment = useCreatePayment();

  function selectStudent(id: string, firstActivityId: string | null) {
    setSelectedStudentId(id);
    setSelectedActivityId(firstActivityId);
    setSelectedMonths([]);
    setSearchInput('');
    setLastPayment(null);
  }

  function clearStudent() {
    setSelectedStudentId(null);
    setSelectedActivityId(null);
    setSelectedMonths([]);
    setLastPayment(null);
  }

  function selectActivity(id: string) {
    setSelectedActivityId(id);
    setSelectedMonths([]);
    setLastPayment(null);
  }

  function toggleMonth(month: number, status: MonthStatus) {
    if (status !== 'pending' && status !== 'partial') return;
    setSelectedMonths((prev) => (prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]));
  }

  const selectedActivity = selectedStudent?.activities.find((a) => a._id === selectedActivityId);
  const fee = selectedActivity?.monthlyFee ?? 0;
  const amount = selectedMonths.length * fee;
  const grandTotal = Math.max(0, amount + lateFee - discount);

  async function handleReceivePayment() {
    if (!selectedStudentId || !selectedActivityId || selectedMonths.length === 0) return;
    try {
      const payment = await createPayment.mutateAsync({
        studentId: selectedStudentId,
        activityId: selectedActivityId,
        months: selectedMonths,
        year,
        discount,
        lateFee,
        paymentMode,
        referenceNo: reference || undefined,
      });
      showToast(`Payment ${payment.receiptNo} of ${formatCurrency(payment.total)} recorded`);
      setLastPayment(payment);
      setSelectedMonths([]);
      setLateFee(0);
      setDiscount(0);
      setReference('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        showToast('One or more selected months were already paid — refresh and try again');
      } else {
        showToast(err instanceof ApiError ? err.message : 'Failed to record payment');
      }
    }
  }

  async function handlePrint() {
    if (!lastPayment) return;
    try {
      const { blob } = await paymentsApi.getReceiptBlob(lastPayment._id, lastPayment.receiptNo);
      openBlobInNewTab(blob);
    } catch {
      showToast('Failed to load receipt');
    }
  }

  async function handleDownload() {
    if (!lastPayment) return;
    try {
      const { blob, filename } = await paymentsApi.getReceiptBlob(lastPayment._id, lastPayment.receiptNo);
      triggerBlobDownload(blob, filename);
    } catch {
      showToast('Failed to download receipt');
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <div className="page-title">Payments</div>
          <div className="page-subtitle">Search a student and collect activity fees</div>
        </div>
      </div>

      <div className="payments-split">
        <div className="payments-left">
          <div className="card">
            <div className="card-header-row">
              <div className="card-kicker">Find Student</div>
              <select className="select" style={{ minWidth: 90 }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-icon-wrap" style={{ position: 'relative' }}>
              <Search size={15} />
              <input
                className="input"
                placeholder="Search by name or admission no…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="typeahead-results">
                  {searchResults.map((s) => (
                    <button
                      key={s._id}
                      className="typeahead-row"
                      onClick={() => selectStudent(s._id, s.activities[0]?._id ?? null)}
                    >
                      <Avatar name={s.name} gradient={gradientForId(s._id)} size={32} />
                      <span className="typeahead-info">
                        <span className="student-name">{s.name}</span>
                        <span className="student-admission">
                          {s.admissionNo} · {s.standard}-{s.section}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedStudent && (
              <div className="selected-student-card">
                <Avatar name={selectedStudent.name} gradient={gradientForId(selectedStudent._id)} size={44} />
                <div className="selected-student-info">
                  <span className="student-name">{selectedStudent.name}</span>
                  <span className="student-admission">
                    Class {selectedStudent.standard}-{selectedStudent.section} · {selectedStudent.admissionNo}
                  </span>
                </div>
                <button className="dialog-close" onClick={clearStudent} aria-label="Clear student">
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          {selectedStudent && selectedStudent.activities.length === 0 && (
            <div className="card empty-state">This student isn&apos;t enrolled in any activities yet.</div>
          )}

          {selectedStudent && selectedStudent.activities.length > 0 && (
            <div className="card">
              <div className="card-kicker" style={{ marginBottom: 10 }}>
                Activity
              </div>
              <div className="activity-picker-list">
                {selectedStudent.activities.map((a) => (
                  <button
                    key={a._id}
                    className={`activity-picker-item${a._id === selectedActivityId ? ' active' : ''}`}
                    onClick={() => selectActivity(a._id)}
                  >
                    <span>{a.name}</span>
                    <span className="activity-picker-fee">{formatCurrency(a.monthlyFee)}/mo</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedStudent && selectedActivity && (
            <div className="card">
              <div className="card-kicker" style={{ marginBottom: 10 }}>
                Select Months ({year})
              </div>
              {!activityStatus ? (
                <PageLoader label="Loading months…" compact />
              ) : (
                <>
                  <div className="month-grid">
                    {activityStatus.months.map((m) => {
                      const clickable = m.status === 'pending' || m.status === 'partial';
                      const selected = selectedMonths.includes(m.month);
                      return (
                        <button
                          key={m.month}
                          className={`month-cell month-cell-${m.status}${selected ? ' selected' : ''}`}
                          disabled={!clickable}
                          onClick={() => toggleMonth(m.month, m.status)}
                        >
                          <span className="month-cell-label">{monthName(m.month).slice(0, 1)}</span>
                          <span className="month-cell-name">{monthName(m.month).slice(0, 3)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="month-legend">
                    <span><i className="legend-dot" style={{ background: 'var(--success)' }} />Paid</span>
                    <span><i className="legend-dot" style={{ background: 'var(--danger)' }} />Pending</span>
                    <span><i className="legend-dot" style={{ background: 'var(--warning)' }} />Partial</span>
                    <span><i className="legend-dot" style={{ background: 'var(--track)' }} />Not started</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="payments-right">
          <div className="card payment-summary-card">
            <div className="card-kicker" style={{ marginBottom: 10 }}>
              Payment Summary
            </div>

            {lastPayment ? (
              <div className="payment-success">
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Payment recorded</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Receipt {lastPayment.receiptNo} · {formatCurrency(lastPayment.total)}
                </div>
                <div className="summary-secondary-actions" style={{ marginTop: 0 }}>
                  <Button variant="secondary" size="sm" onClick={handlePrint}>
                    <Printer size={14} />
                    Print Receipt
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleDownload}>
                    <Download size={14} />
                    Download PDF
                  </Button>
                </div>
                <Button variant="ghost" className="full-width-btn" style={{ marginTop: 10 }} onClick={() => setLastPayment(null)}>
                  New Payment
                </Button>
              </div>
            ) : selectedMonths.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                Select months to collect payment for.
              </div>
            ) : (
              <>
                <div className="summary-months">
                  {selectedMonths
                    .slice()
                    .sort((a, b) => a - b)
                    .map((month) => (
                      <Badge key={month} tone="info">
                        {monthName(month)}
                      </Badge>
                    ))}
                </div>

                <div className="summary-row">
                  <span>Amount</span>
                  <span>{formatCurrency(amount)}</span>
                </div>

                <div className="form-field" style={{ marginTop: 12 }}>
                  <label className="form-label">Late Fee</label>
                  <input
                    type="number"
                    className="input"
                    value={lateFee}
                    min={0}
                    onChange={(e) => setLateFee(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="form-field" style={{ marginTop: 12 }}>
                  <label className="form-label">Discount</label>
                  <input
                    type="number"
                    className="input"
                    value={discount}
                    min={0}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  />
                </div>

                <div className="form-field" style={{ marginTop: 12 }}>
                  <label className="form-label">Payment Method</label>
                  <div className="segmented">
                    {PAYMENT_MODES.map((mode) => (
                      <button
                        key={mode}
                        className={`segmented-item${paymentMode === mode ? ' active' : ''}`}
                        onClick={() => setPaymentMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-field" style={{ marginTop: 12 }}>
                  <label className="form-label">Reference Number</label>
                  <input
                    className="input"
                    placeholder="Optional"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>

                <div className="summary-row summary-total">
                  <span>Grand Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>

                <Button
                  className="full-width-btn"
                  style={{ marginTop: 16 }}
                  disabled={selectedMonths.length === 0 || createPayment.isPending}
                  onClick={handleReceivePayment}
                >
                  {createPayment.isPending ? 'Processing…' : 'Receive Payment'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
