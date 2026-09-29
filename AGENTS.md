<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Order/payment writes use SECURITY DEFINER RPCs (create_order, mark_order_paid, cancel_pending_order, ...) via the publishable key; trusted ones check ORDER_RPC_SECRET against private.app_config. Why: self-hosted VPS has no service-role key.
- Stock is deducted only in mark_order_paid (payment confirmed), never at create_order; orders.stock_reserved flags legacy pre-reserved orders. Why: pending checkouts must not block stock for other buyers.
- Admin password changes use an authenticated, role-checked server function and the server-only Auth Admin client. Why: secure password change rejects old sessions; the elevated key must never reach the browser (external VPS deployments require a separately provisioned service-role credential).
