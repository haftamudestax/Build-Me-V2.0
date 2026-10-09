-- Row-level security for the messages table.
-- A message is only visible/writable if the user owns the parent conversation
-- (there is no direct user_id on messages, so this checks via a subquery).

alter table messages enable row level security;

create policy "Users can view messages in their own conversations"
  on messages for select
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users can insert messages into their own conversations"
  on messages for insert
  with check (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );
