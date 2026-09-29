export const Loading = ({ label = 'Loading' }) => <div className="empty" aria-busy="true"><p className="muted">{label}…</p></div>;
export const ErrorState = ({ error, retry }) => (
  <div className="empty"><h3>Something went wrong</h3><p className="muted">{error?.message || 'Please try again.'}</p>{retry && <button className="btn ghost" onClick={retry}>Try again</button>}</div>
);
