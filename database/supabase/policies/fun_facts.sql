ALTER TABLE fun_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read fun facts"
ON fun_facts
FOR SELECT
TO anon
USING (true);
