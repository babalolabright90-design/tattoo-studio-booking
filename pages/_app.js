.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #020817 0%, #111827 100%);
  padding: 40px 20px;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
}

.card {
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  padding: 28px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.title {
  margin: 0;
  font-size: 2rem;
}

.loginCard {
  max-width: 480px;
  margin: 60px auto 0;
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.formGroup label {
  font-weight: 600;
}

.formGroup input,
.formGroup select {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  color: #e2e8f0;
  padding: 12px 14px;
}

.primaryButton,
.secondaryButton,
.statusButton {
  border: none;
  border-radius: 12px;
  padding: 12px 18px;
  font-weight: 700;
  cursor: pointer;
}

.primaryButton {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: white;
  width: 100%;
}

.secondaryButton {
  background: #0f172a;
  color: white;
  border: 1px solid #475569;
}

.statusButton {
  margin-right: 8px;
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #475569;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.table th,
.table td {
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  padding: 14px 12px;
  text-align: left;
  vertical-align: top;
}

.table th {
  color: #cbd5e1;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: capitalize;
}

.badgePending {
  background: rgba(245, 158, 11, 0.18);
  color: #fcd34d;
}

.badgeConfirmed {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
}

.badgeCompleted {
  background: rgba(59, 130, 246, 0.18);
  color: #93c5fd;
}

.badgeCancelled {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
}

.success,
.error {
  margin-bottom: 18px;
  padding: 12px 16px;
  border-radius: 12px;
}

.success {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #a7f3d0;
}

.error {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.toolbar input,
.toolbar select {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  color: #e2e8f0;
  padding: 10px 12px;
}

@media (max-width: 720px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .table {
    display: block;
    overflow-x: auto;
  }
}
