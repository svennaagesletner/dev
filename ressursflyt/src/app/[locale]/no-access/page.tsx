export default function NoAccessPage() {
  return (
    <div className="max-w-2xl space-y-3 rounded border p-5">
      <h1 className="text-2xl font-semibold">No access</h1>
      <p>Your account is authenticated but has no accepted membership yet.</p>
      <p>Ask a municipality admin to create an invite and use the invite token on the accept-invite page.</p>
    </div>
  );
}
