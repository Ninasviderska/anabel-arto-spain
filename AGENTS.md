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
