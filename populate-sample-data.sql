DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id from existing profile
  SELECT id INTO v_user_id FROM profiles WHERE email = 'kitdans@gmail.com' LIMIT 1;
  
  -- If no user exists, you'll need to create one first via signup
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please sign up first to create a profile.';
  END IF;

  -- Insert Medical Records
  INSERT INTO medical_records (user_id, category, title, description, status, start_date, end_date, metadata) VALUES
  (v_user_id, 'medications', 'Paracetamol', '600 mg daily for pain management', 'ongoing', '2025-05-12', '2025-05-20', '{"dosage": "600mg", "frequency": "daily"}'),
  (v_user_id, 'allergies', 'Lactose Intolerance', 'Reaction: Bloating, Nausea', 'completed', NULL, NULL, '{"severity": "moderate", "reaction": "Bloating, Nausea"}'),
  (v_user_id, 'chronic_conditions', 'Hypertension', 'High blood pressure, managed with medication', 'ongoing', '2024-01-15', NULL, '{"severity": "moderate"}'),
  (v_user_id, 'lab_results', 'Blood Test - Complete Blood Count', 'Routine CBC test results', 'completed', '2025-02-10', NULL, '{"test_type": "CBC", "lab": "City Hospital"}'),
  (v_user_id, 'past_treatments', 'Appendectomy', 'Surgical removal of appendix', 'completed', '2020-06-15', '2020-06-20', '{"procedure": "surgery", "hospital": "General Hospital"}'),
  (v_user_id, 'vaccinations', 'COVID-19 Vaccine', 'Pfizer-BioNTech, 2 doses', 'completed', '2021-03-10', '2021-04-05', '{"vaccine_type": "Pfizer", "doses": 2}');

  -- Insert Share Tokens
  INSERT INTO share_tokens (user_id, method, token, record_ids, expires_at, status) VALUES
  (v_user_id, 'code', 'ABC123', ARRAY[(SELECT id FROM medical_records WHERE title = 'Paracetamol' LIMIT 1)], NOW() + INTERVAL '15 minutes', 'active'),
  (v_user_id, 'link', 'xyz789', ARRAY[(SELECT id FROM medical_records WHERE category = 'allergies' LIMIT 1), (SELECT id FROM medical_records WHERE category = 'chronic_conditions' LIMIT 1)], NOW() + INTERVAL '1 hour', 'active'),
  (v_user_id, 'code', 'DEF456', ARRAY[(SELECT id FROM medical_records WHERE category = 'lab_results' LIMIT 1)], NOW() - INTERVAL '1 day', 'expired');

  -- Insert Access Logs
  INSERT INTO access_logs (user_id, record_id, action, ip_address, user_agent) VALUES
  (v_user_id, (SELECT id FROM medical_records WHERE title = 'Paracetamol' LIMIT 1), 'view', '192.168.1.1', 'Mozilla/5.0'),
  (v_user_id, (SELECT id FROM medical_records WHERE title = 'Lactose Intolerance' LIMIT 1), 'create', '192.168.1.1', 'Mozilla/5.0'),
  (v_user_id, (SELECT id FROM medical_records WHERE category = 'lab_results' LIMIT 1), 'view', '192.168.1.2', 'Mozilla/5.0'),
  (v_user_id, NULL, 'share', '192.168.1.1', 'Mozilla/5.0'),
  (v_user_id, (SELECT id FROM medical_records WHERE title = 'Paracetamol' LIMIT 1), 'access_shared', '10.0.0.1', 'Chrome/120.0');

END $$;
