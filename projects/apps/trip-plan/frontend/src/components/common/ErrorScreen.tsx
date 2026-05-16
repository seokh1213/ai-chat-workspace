interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <main className="app-page">
      <div className="error-card">
        <strong>앱을 열 수 없습니다</strong>
        <p>{message}</p>
        <button className="primary-button" type="button" onClick={onRetry}>
          다시 시도
        </button>
      </div>
    </main>
  );
}
