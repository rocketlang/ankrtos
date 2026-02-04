-- =============================================================================
-- LEGAL KNOWLEDGE BASE FOR ANKR COMPLIANCE PLATFORM
-- Jai GuruJi! Shree Ganesh!
-- Created: December 22, 2025
-- =============================================================================

-- =============================================================================
-- 1. CREATE TABLES
-- =============================================================================

-- Legal Acts (Parent table)
CREATE TABLE IF NOT EXISTS compliance."LegalAct" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    year INTEGER,
    description TEXT,
    category TEXT NOT NULL, -- CRIMINAL, CIVIL, CORPORATE, TAX, LABOUR
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legal Sections (Main content)
CREATE TABLE IF NOT EXISTS compliance."LegalSection" (
    id TEXT PRIMARY KEY,
    "actId" TEXT NOT NULL REFERENCES compliance."LegalAct"(id),
    "sectionNumber" TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    "fullText" TEXT,
    punishment TEXT,
    "punishmentYears" INTEGER,
    "punishmentFine" TEXT,
    "isBailable" BOOLEAN,
    "isCognizable" BOOLEAN,
    "isCompoundable" BOOLEAN,
    keywords TEXT[], -- For search
    "relatedSections" TEXT[], -- Related section IDs
    "businessRelevance" TEXT, -- Why this matters for business
    procedure TEXT, -- Step by step procedure if applicable
    "limitationPeriod" TEXT, -- Time limit for filing
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("actId", "sectionNumber")
);

-- Legal Templates (for generating responses/notices)
CREATE TABLE IF NOT EXISTS compliance."LegalTemplate" (
    id TEXT PRIMARY KEY,
    "sectionId" TEXT REFERENCES compliance."LegalSection"(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- NOTICE, REPLY, COMPLAINT, APPLICATION
    description TEXT,
    template TEXT NOT NULL,
    variables TEXT[], -- Placeholder variables like {{name}}, {{amount}}
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Case Law / Precedents (for reference)
CREATE TABLE IF NOT EXISTS compliance."CaseLaw" (
    id TEXT PRIMARY KEY,
    "sectionId" TEXT REFERENCES compliance."LegalSection"(id),
    "caseName" TEXT NOT NULL,
    citation TEXT,
    court TEXT,
    year INTEGER,
    summary TEXT,
    "keyPrinciple" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_legal_section_act ON compliance."LegalSection"("actId");
CREATE INDEX IF NOT EXISTS idx_legal_section_keywords ON compliance."LegalSection" USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_legal_template_section ON compliance."LegalTemplate"("sectionId");
CREATE INDEX IF NOT EXISTS idx_case_law_section ON compliance."CaseLaw"("sectionId");

-- =============================================================================
-- 2. SEED LEGAL ACTS
-- =============================================================================

INSERT INTO compliance."LegalAct" (id, name, "shortName", year, description, category) VALUES
('IPC', 'Indian Penal Code', 'IPC', 1860, 'The main criminal code of India that covers all substantive aspects of criminal law', 'CRIMINAL'),
('NI_ACT', 'Negotiable Instruments Act', 'NI Act', 1881, 'Defines and governs promissory notes, bills of exchange, and cheques', 'CIVIL'),
('COMPANIES_ACT', 'Companies Act', 'Companies Act', 2013, 'Regulates incorporation, responsibilities of companies, directors, dissolution', 'CORPORATE'),
('GST_ACT', 'Central Goods and Services Tax Act', 'CGST Act', 2017, 'Governs GST on intra-state supply of goods and services', 'TAX'),
('IT_ACT', 'Income Tax Act', 'IT Act', 1961, 'Governs income tax in India', 'TAX'),
('CONTRACT_ACT', 'Indian Contract Act', 'Contract Act', 1872, 'Defines and governs contracts in India', 'CIVIL'),
('EPF_ACT', 'Employees Provident Funds and Miscellaneous Provisions Act', 'EPF Act', 1952, 'Provides for provident funds, pension and insurance for employees', 'LABOUR'),
('ESI_ACT', 'Employees State Insurance Act', 'ESI Act', 1948, 'Provides health insurance and social security to workers', 'LABOUR')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. SEED IPC SECTIONS (Business Relevant)
-- =============================================================================

INSERT INTO compliance."LegalSection" (id, "actId", "sectionNumber", title, description, "fullText", punishment, "punishmentYears", "punishmentFine", "isBailable", "isCognizable", "isCompoundable", keywords, "relatedSections", "businessRelevance", "limitationPeriod") VALUES

-- Section 403 - Dishonest Misappropriation
('IPC_403', 'IPC', '403', 'Dishonest Misappropriation of Property', 
'Whoever dishonestly misappropriates or converts to his own use any movable property, shall be punished.',
'Whoever dishonestly misappropriates or converts to his own use any movable property, shall be punished with imprisonment of either description for a term which may extend to two years, or with fine, or with both.',
'Imprisonment up to 2 years, or fine, or both', 2, 'As court deems fit',
true, false, true,
ARRAY['misappropriation', 'property', 'dishonest', 'conversion', 'theft'],
ARRAY['IPC_404', 'IPC_405', 'IPC_406'],
'Applies when an employee or partner misappropriates company funds or assets. Common in cases of petty cash misuse, inventory theft.',
'3 years'),

-- Section 405 - Criminal Breach of Trust (Definition)
('IPC_405', 'IPC', '405', 'Criminal Breach of Trust - Definition',
'Whoever, being entrusted with property or with dominion over property, dishonestly misappropriates or converts to his own use that property, or dishonestly uses or disposes of that property in violation of any direction of law prescribing the mode in which such trust is to be discharged, commits criminal breach of trust.',
'Whoever, being in any manner entrusted with property, or with any dominion over property, dishonestly misappropriates or converts to his own use that property, or dishonestly uses or disposes of that property in violation of any direction of law prescribing the mode in which such trust is to be discharged, or of any legal contract, express or implied, which he has made touching the discharge of such trust, or wilfully suffers any other person so to do, commits "criminal breach of trust".',
'Definition section - See Section 406 for punishment', NULL, NULL,
NULL, NULL, NULL,
ARRAY['trust', 'breach', 'entrusted', 'property', 'misappropriation', 'fiduciary'],
ARRAY['IPC_406', 'IPC_407', 'IPC_408', 'IPC_409'],
'Defines the offense. Key for understanding when directors, employees, or agents breach their fiduciary duties.',
NULL),

-- Section 406 - Criminal Breach of Trust (Punishment)
('IPC_406', 'IPC', '406', 'Criminal Breach of Trust - Punishment',
'Whoever commits criminal breach of trust shall be punished with imprisonment and fine.',
'Whoever commits criminal breach of trust shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.',
'Imprisonment up to 3 years, or fine, or both', 3, 'As court deems fit',
true, false, true,
ARRAY['trust', 'breach', 'punishment', 'employee', 'director', 'agent'],
ARRAY['IPC_405', 'IPC_408', 'IPC_409'],
'VERY COMMON in business disputes. Used against employees who misuse company funds, directors who siphon money, agents who dont remit collections. Compoundable with permission of court.',
'3 years'),

-- Section 408 - CBT by Clerk or Servant
('IPC_408', 'IPC', '408', 'Criminal Breach of Trust by Clerk or Servant',
'Whoever, being a clerk or servant or employed as a clerk or servant, commits criminal breach of trust.',
'Whoever, being a clerk or servant or employed as a clerk or servant, and being in any manner entrusted in such capacity with property, or with any dominion over property, commits criminal breach of trust in respect of that property, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.',
'Imprisonment up to 7 years AND fine', 7, 'Mandatory fine',
false, true, false,
ARRAY['clerk', 'servant', 'employee', 'trust', 'breach'],
ARRAY['IPC_405', 'IPC_406', 'IPC_409'],
'Specifically for employees. Higher punishment than 406. Non-bailable and cognizable - police can arrest without warrant.',
'3 years'),

-- Section 409 - CBT by Public Servant/Banker/Merchant/Agent
('IPC_409', 'IPC', '409', 'Criminal Breach of Trust by Public Servant, Banker, Merchant or Agent',
'Criminal breach of trust by public servant, or by banker, merchant or agent.',
'Whoever, being in any manner entrusted with property, or with any dominion over property in his capacity of a public servant or in the way of his business as a banker, merchant, factor, broker, attorney or agent, commits criminal breach of trust in respect of that property, shall be punished with imprisonment for life, or with imprisonment of either description for a term which may extend to ten years, and shall also be liable to fine.',
'Life imprisonment OR up to 10 years AND fine', 10, 'Mandatory fine',
false, true, false,
ARRAY['banker', 'merchant', 'agent', 'broker', 'attorney', 'public servant', 'trust'],
ARRAY['IPC_405', 'IPC_406', 'IPC_408'],
'Most serious form. Applies to CAs, CSs, lawyers, brokers, agents handling client money. Can result in life imprisonment.',
'3 years'),

-- Section 415 - Cheating (Definition)
('IPC_415', 'IPC', '415', 'Cheating - Definition',
'Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property.',
'Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person, or to consent that any person shall retain any property, or intentionally induces the person so deceived to do or omit to do anything which he would not do or omit if he were not so deceived, and which act or omission causes or is likely to cause damage or harm to that person in body, mind, reputation or property, is said to "cheat".',
'Definition section - See Section 417 for simple cheating, 420 for cheating with inducement', NULL, NULL,
NULL, NULL, NULL,
ARRAY['cheating', 'deception', 'fraud', 'inducement', 'property'],
ARRAY['IPC_417', 'IPC_418', 'IPC_419', 'IPC_420'],
'Defines cheating. Foundation for understanding Sections 417-420.',
NULL),

-- Section 417 - Cheating (Simple)
('IPC_417', 'IPC', '417', 'Punishment for Cheating',
'Whoever cheats shall be punished.',
'Whoever cheats shall be punished with imprisonment of either description for a term which may extend to one year, or with fine, or with both.',
'Imprisonment up to 1 year, or fine, or both', 1, 'As court deems fit',
true, false, true,
ARRAY['cheating', 'simple', 'punishment'],
ARRAY['IPC_415', 'IPC_420'],
'Simple cheating without dishonest inducement. Bailable and compoundable.',
'3 years'),

-- Section 420 - Cheating and Dishonestly Inducing Delivery
('IPC_420', 'IPC', '420', 'Cheating and Dishonestly Inducing Delivery of Property',
'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property.',
'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, or anything which is signed or sealed, and which is capable of being converted into a valuable security, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.',
'Imprisonment up to 7 years AND fine', 7, 'Mandatory fine',
false, true, false,
ARRAY['cheating', '420', 'fraud', 'inducement', 'property', 'valuable security'],
ARRAY['IPC_415', 'IPC_417', 'IPC_418', 'IPC_419'],
'MOST COMMON business complaint. Used for: bounced cheques (along with 138 NI Act), fraudulent contracts, investment fraud, fake invoices, advance payment fraud. Non-bailable.',
'3 years'),

-- Section 463 - Forgery (Definition)
('IPC_463', 'IPC', '463', 'Forgery - Definition',
'Whoever makes any false document or electronic record with intent to cause damage or injury.',
'Whoever makes any false document or false electronic record or part of a document or electronic record, with intent to cause damage or injury, to the public or to any person, or to support any claim or title, or to cause any person to part with property, or to enter into any express or implied contract, or with intent to commit fraud or that fraud may be committed, commits forgery.',
'Definition section - See Section 465 for punishment', NULL, NULL,
NULL, NULL, NULL,
ARRAY['forgery', 'false document', 'electronic record', 'fraud'],
ARRAY['IPC_464', 'IPC_465', 'IPC_466', 'IPC_467', 'IPC_468'],
'Defines forgery. Includes electronic documents - relevant for digital signature fraud.',
NULL),

-- Section 465 - Forgery (Punishment)
('IPC_465', 'IPC', '465', 'Punishment for Forgery',
'Whoever commits forgery shall be punished.',
'Whoever commits forgery shall be punished with imprisonment of either description for a term which may extend to two years, or with fine, or with both.',
'Imprisonment up to 2 years, or fine, or both', 2, 'As court deems fit',
true, false, true,
ARRAY['forgery', 'punishment', 'false document'],
ARRAY['IPC_463', 'IPC_467', 'IPC_468'],
'Basic forgery punishment. Bailable.',
'3 years'),

-- Section 467 - Forgery of Valuable Security
('IPC_467', 'IPC', '467', 'Forgery of Valuable Security, Will, etc.',
'Whoever forges a document purporting to be a valuable security or a will.',
'Whoever forges a document which purports to be a valuable security or a will, or an authority to adopt a son, or which purports to give authority to any person to make or transfer any valuable security, or to receive the principal, interest or dividends thereon, or to receive or deliver any money, movable property, or valuable security, or any document purporting to be an acquittance or receipt acknowledging the payment of money, or an acquittance or receipt for the delivery of any movable property or valuable security, shall be punished with imprisonment for life, or with imprisonment of either description for a term which may extend to ten years, and shall also be liable to fine.',
'Life imprisonment OR up to 10 years AND fine', 10, 'Mandatory fine',
false, true, false,
ARRAY['forgery', 'valuable security', 'will', 'cheque', 'promissory note'],
ARRAY['IPC_463', 'IPC_465', 'IPC_468'],
'Forging cheques, promissory notes, share certificates, property documents. Very serious - can get life imprisonment.',
'3 years'),

-- Section 468 - Forgery for Cheating
('IPC_468', 'IPC', '468', 'Forgery for Purpose of Cheating',
'Whoever commits forgery, intending that the document forged shall be used for the purpose of cheating.',
'Whoever commits forgery, intending that the document or electronic record forged shall be used for the purpose of cheating, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.',
'Imprisonment up to 7 years AND fine', 7, 'Mandatory fine',
false, true, false,
ARRAY['forgery', 'cheating', 'false document'],
ARRAY['IPC_463', 'IPC_465', 'IPC_467', 'IPC_420'],
'Combines forgery + cheating. Common in fake invoice cases, fraudulent contracts.',
'3 years'),

-- Section 499 - Defamation (Definition)
('IPC_499', 'IPC', '499', 'Defamation - Definition',
'Whoever makes or publishes any imputation concerning any person intending to harm the reputation of such person.',
'Whoever, by words either spoken or intended to be read, or by signs or by visible representations, makes or publishes any imputation concerning any person intending to harm, or knowing or having reason to believe that such imputation will harm, the reputation of such person, is said to defame that person.',
'Definition section - See Section 500 for punishment', NULL, NULL,
NULL, NULL, NULL,
ARRAY['defamation', 'reputation', 'imputation', 'libel', 'slander'],
ARRAY['IPC_500', 'IPC_501', 'IPC_502'],
'Defines defamation. Has 10 exceptions including truth for public good, fair comment, etc.',
NULL),

-- Section 500 - Defamation (Punishment)
('IPC_500', 'IPC', '500', 'Punishment for Defamation',
'Whoever defames another shall be punished.',
'Whoever defames another shall be punished with simple imprisonment for a term which may extend to two years, or with fine, or with both.',
'Simple imprisonment up to 2 years, or fine, or both', 2, 'As court deems fit',
true, false, true,
ARRAY['defamation', 'punishment', 'reputation'],
ARRAY['IPC_499'],
'Used in business disputes involving bad reviews, false allegations against company/directors, social media defamation. Compoundable - can be settled.',
'3 years'),

-- Section 120B - Criminal Conspiracy
('IPC_120B', 'IPC', '120B', 'Punishment of Criminal Conspiracy',
'When two or more persons agree to do an illegal act or a legal act by illegal means.',
'Whoever is a party to a criminal conspiracy to commit an offence punishable with death, imprisonment for life or rigorous imprisonment for a term of two years or upwards, shall, where no express provision is made in this Code for the punishment of such a conspiracy, be punished in the same manner as if he had abetted such offence. Whoever is a party to a criminal conspiracy other than a criminal conspiracy to commit an offence punishable as aforesaid shall be punished with imprisonment of either description for a term not exceeding six months, or with fine or with both.',
'Same as the main offense if serious; up to 6 months otherwise', NULL, 'As applicable',
false, true, false,
ARRAY['conspiracy', 'agreement', 'illegal act', 'abetment'],
ARRAY['IPC_107', 'IPC_108', 'IPC_109'],
'Often added with 420, 406, 467 when multiple people involved in fraud. Makes all conspirators equally liable.',
'3 years')

ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    "fullText" = EXCLUDED."fullText",
    punishment = EXCLUDED.punishment,
    "businessRelevance" = EXCLUDED."businessRelevance",
    "updatedAt" = CURRENT_TIMESTAMP;

-- =============================================================================
-- 4. SEED NI ACT SECTIONS (Cheque Bounce - Complete)
-- =============================================================================

INSERT INTO compliance."LegalSection" (id, "actId", "sectionNumber", title, description, "fullText", punishment, "punishmentYears", "punishmentFine", "isBailable", "isCognizable", "isCompoundable", keywords, "relatedSections", "businessRelevance", procedure, "limitationPeriod") VALUES

-- Section 138 - Dishonour of Cheque
('NI_138', 'NI_ACT', '138', 'Dishonour of Cheque for Insufficiency of Funds',
'If a cheque is returned unpaid due to insufficient funds, the drawer is liable for punishment.',
'Where any cheque drawn by a person on an account maintained by him with a banker for payment of any amount of money to another person from out of that account for the discharge, in whole or in part, of any debt or other liability, is returned by the bank unpaid, either because of the amount of money standing to the credit of that account is insufficient to honour the cheque or that it exceeds the amount arranged to be paid from that account by an agreement made with that bank, such person shall be deemed to have committed an offence and shall, without prejudice to any other provision of this Act, be punished with imprisonment for a term which may extend to two years, or with fine which may extend to twice the amount of the cheque, or with both.',
'Imprisonment up to 2 years OR fine up to twice the cheque amount OR both', 2, 'Up to 2x cheque amount',
true, false, true,
ARRAY['cheque bounce', 'dishonour', 'insufficient funds', '138', 'NI Act', 'negotiable instrument'],
ARRAY['NI_139', 'NI_140', 'NI_141', 'NI_142', 'NI_143', 'NI_144', 'NI_145', 'NI_146', 'NI_147'],
'MOST IMPORTANT for business. Every bounced cheque can lead to criminal prosecution. Conditions: (1) Cheque for existing debt/liability, (2) Presented within 3 months of date, (3) Legal notice within 30 days of bounce, (4) Drawer fails to pay within 15 days of notice, (5) Complaint within 30 days of expiry of 15-day period.',
'STEP-BY-STEP PROCEDURE FOR CHEQUE BOUNCE CASE:

1. CHEQUE BOUNCES - Bank returns with memo (Insufficient Funds/Account Closed/Stop Payment etc.)

2. SEND LEGAL NOTICE (within 30 days of bounce):
   - Send by Registered Post AD / Speed Post / Courier with POD
   - Address to drawer at address on cheque
   - Demand payment of cheque amount
   - Give 15 days time to pay
   - Keep copy of notice and postal receipt

3. WAIT 15 DAYS from receipt of notice by drawer

4. IF NOT PAID - File complaint (within 30 days of expiry of 15-day period):
   - File in Magistrate Court where cheque was delivered/presented OR where drawer resides/works
   - Include: Original cheque, Bank memo, Copy of notice, Postal receipt, Affidavit

5. COURT PROCESS:
   - Court issues summons
   - Accused appears, may apply for bail
   - Evidence stage - complainant examines witnesses
   - Cross-examination
   - Defense evidence
   - Arguments
   - Judgment

6. IF CONVICTED:
   - Imprisonment up to 2 years AND/OR
   - Fine up to 2x cheque amount
   - Compensation to complainant (Section 357 CrPC)

IMPORTANT TIMELINES:
- Present cheque within 3 months of date on cheque
- Send notice within 30 days of bounce
- File complaint within 30 days after 15-day notice period expires
- Total: Approximately 75 days from bounce to last date for filing

DEFENSES AVAILABLE TO DRAWER:
- Cheque was not for debt/liability
- Cheque was given as security/gift
- Payment already made
- Notice not received
- Complaint not filed in time
- Cheque altered/tampered',
'Complaint must be filed within 30 days of expiry of 15-day notice period (extendable for sufficient cause)'),

-- Section 139 - Presumption in favour of holder
('NI_139', 'NI_ACT', '139', 'Presumption in Favour of Holder',
'It shall be presumed that the holder of a cheque received it for discharge of debt or liability.',
'It shall be presumed, unless the contrary is proved, that the holder of a cheque received the cheque of the nature referred to in section 138 for the discharge, in whole or in part, of any debt or other liability.',
'Presumption - shifts burden to accused', NULL, NULL,
NULL, NULL, NULL,
ARRAY['presumption', 'holder', 'debt', 'liability'],
ARRAY['NI_138', 'NI_118'],
'Very important - complainant does not need to prove debt existed. Accused must prove cheque was NOT for debt. Strong advantage for complainant.',
NULL, NULL),

-- Section 140 - Defense which may not be allowed
('NI_140', 'NI_ACT', '140', 'Defence Which May Not Be Allowed in Prosecution Under Section 138',
'It shall not be a defence that drawer had no reason to believe the cheque would bounce.',
'It shall not be a defence in a prosecution for an offence under section 138 that the drawer had no reason to believe when he issued the cheque that the cheque may be dishonoured on presentment for the reasons stated in that section.',
'Not a valid defense', NULL, NULL,
NULL, NULL, NULL,
ARRAY['defense', 'reason to believe', 'dishonour'],
ARRAY['NI_138'],
'Drawer cannot escape by saying "I thought I had enough balance". Intent is irrelevant.',
NULL, NULL),

-- Section 141 - Offences by Companies
('NI_141', 'NI_ACT', '141', 'Offences by Companies',
'If the person committing an offence is a company, every person in charge shall be deemed guilty.',
'If the person committing an offence under section 138 is a company, every person who, at the time the offence was committed, was in charge of, and was responsible to the company for the conduct of the business of the company, as well as the company, shall be deemed to be guilty of the offence and shall be liable to be proceeded against and punished accordingly.',
'Directors/persons in charge also liable', NULL, NULL,
NULL, NULL, NULL,
ARRAY['company', 'director', 'vicarious liability', 'in charge'],
ARRAY['NI_138', 'NI_142'],
'CRITICAL - Directors and officers can be personally prosecuted for company cheque bounce. Need to be "in charge of and responsible for" business conduct. Signing authority alone is not enough.',
NULL, NULL),

-- Section 142 - Cognizance of Offences
('NI_142', 'NI_ACT', '142', 'Cognizance of Offences',
'Notwithstanding anything in CrPC, no court shall take cognizance except on written complaint by payee or holder.',
'Notwithstanding anything contained in the Code of Criminal Procedure, 1973: (a) no court shall take cognizance of any offence punishable under section 138 except upon a complaint, in writing, made by the payee or, as the case may be, the holder in due course of the cheque; (b) such complaint is made within one month of the date on which the cause of action arises under clause (c) of the proviso to section 138; (c) no court inferior to that of a Metropolitan Magistrate or a Judicial Magistrate of the first class shall try any offence punishable under section 138.',
'Procedural requirements for filing complaint', NULL, NULL,
NULL, NULL, NULL,
ARRAY['cognizance', 'complaint', 'limitation', 'jurisdiction', 'magistrate'],
ARRAY['NI_138', 'NI_143'],
'Sets strict timeline - complaint within 1 month (30 days) of cause of action (i.e., 15 days after notice period expires). Late filing = case dismissed.',
NULL, '30 days from cause of action (extendable under Section 142(b))')

ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    "fullText" = EXCLUDED."fullText",
    punishment = EXCLUDED.punishment,
    "businessRelevance" = EXCLUDED."businessRelevance",
    procedure = EXCLUDED.procedure,
    "updatedAt" = CURRENT_TIMESTAMP;

-- =============================================================================
-- 5. SEED COMPANIES ACT SECTIONS
-- =============================================================================

INSERT INTO compliance."LegalSection" (id, "actId", "sectionNumber", title, description, punishment, "punishmentFine", keywords, "businessRelevance") VALUES

('CA_447', 'COMPANIES_ACT', '447', 'Punishment for Fraud',
'Any person who is found to be guilty of fraud shall be punishable with imprisonment and fine.',
'Imprisonment from 6 months to 10 years AND fine from amount involved to 3x amount involved', 'Amount involved to 3x amount',
ARRAY['fraud', 'punishment', 'imprisonment', 'fine', 'company fraud'],
'Covers all company-related fraud. Directors, KMPs, auditors all can be prosecuted. Very wide definition of fraud. Minimum 6 months imprisonment - no probation for first offense.'),

('CA_448', 'COMPANIES_ACT', '448', 'Punishment for False Statement',
'If any person makes false statement in any return, report, certificate, financial statement, prospectus.',
'Imprisonment from 6 months to 10 years AND fine from amount involved to 3x amount involved', 'Amount involved to 3x amount',
ARRAY['false statement', 'return', 'prospectus', 'financial statement'],
'Filing false ROC returns, wrong financial statements. Same punishment as fraud.'),

('CA_449', 'COMPANIES_ACT', '449', 'Punishment for False Evidence',
'If any person intentionally gives false evidence in examination, judicial proceeding, affidavit.',
'Imprisonment from 3 to 7 years AND fine from Rs 1 lakh to Rs 25 lakhs', 'Rs 1 lakh to Rs 25 lakhs',
ARRAY['false evidence', 'perjury', 'affidavit', 'examination'],
'Giving false statements to ROC, NCLT, or in company meetings documented in minutes.'),

('CA_452', 'COMPANIES_ACT', '452', 'Punishment for Wrongful Withholding of Property',
'If any officer or employee wrongfully withholds property of company.',
'Fine up to Rs 1 lakh AND Rs 1000/day for continuing default', 'Up to Rs 1 lakh + Rs 1000/day',
ARRAY['withholding', 'property', 'officer', 'employee', 'company property'],
'Ex-employees or directors not returning company property, records, documents.'),

('CA_447_2013', 'COMPANIES_ACT', '447 Explanation', 'Definition of Fraud',
'Fraud includes any act, omission, concealment, abuse of position committed with intent to deceive, gain undue advantage.',
'See Section 447 for punishment', NULL,
ARRAY['fraud', 'definition', 'intent', 'deceive', 'concealment'],
'Very wide definition - includes omissions and concealment. Any intentional wrong by company officials can be fraud.')

ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    punishment = EXCLUDED.punishment,
    "businessRelevance" = EXCLUDED."businessRelevance",
    "updatedAt" = CURRENT_TIMESTAMP;

-- =============================================================================
-- 6. SEED GST ACT SECTIONS (Penalties & Offenses)
-- =============================================================================

INSERT INTO compliance."LegalSection" (id, "actId", "sectionNumber", title, description, punishment, "punishmentFine", keywords, "businessRelevance") VALUES

('GST_122', 'GST_ACT', '122', 'Penalty for Certain Offences',
'Penalty for: supplying without invoice, issuing incorrect invoice, not registering when required, submitting false info, etc.',
'Penalty equal to tax evaded or Rs 10,000 whichever is higher', 'Tax evaded or Rs 10,000 minimum',
ARRAY['penalty', 'tax evasion', 'false invoice', 'fake invoice', 'unregistered supply'],
'Most common GST penalty section. Covers fake invoicing, ITC fraud, non-registration.'),

('GST_123', 'GST_ACT', '123', 'Penalty for Failure to Furnish Information',
'Person who fails to furnish information or return required by Act.',
'Penalty up to Rs 25,000', 'Up to Rs 25,000',
ARRAY['information', 'return', 'furnish', 'failure'],
'Not filing returns, not responding to notices.'),

('GST_125', 'GST_ACT', '125', 'General Penalty',
'Contravention for which no specific penalty provided.',
'Penalty up to Rs 25,000', 'Up to Rs 25,000',
ARRAY['general penalty', 'contravention'],
'Catch-all provision for violations not covered elsewhere.'),

('GST_132', 'GST_ACT', '132', 'Punishment for Certain Offences',
'Criminal prosecution for serious offenses like fake invoicing, fraudulent refund, etc.',
'Imprisonment from 6 months to 5 years AND fine for tax evasion above Rs 5 crore; 3 years for Rs 2-5 crore; 1 year for Rs 1-2 crore', 'As per offense',
ARRAY['criminal', 'prosecution', 'imprisonment', 'fake invoice', 'fraudulent refund', 'ITC fraud'],
'CRIMINAL prosecution for GST fraud. Amount-based: >5Cr = up to 5 years, 2-5Cr = up to 3 years, 1-2Cr = up to 1 year. Non-bailable for >5Cr.'),

('GST_73', 'GST_ACT', '73', 'Determination of Tax Not Paid - Normal Cases',
'Where tax not paid due to reasons other than fraud - demand notice provisions.',
'Tax + Interest + 10% penalty (if paid within 30 days) or Tax + Interest + 100% penalty', 'Up to 100% of tax',
ARRAY['demand', 'notice', 'tax not paid', 'determination', 'SCN'],
'Normal assessment cases. 3-year limitation. Can be closed with tax + interest + 10% penalty within 30 days of SCN.'),

('GST_74', 'GST_ACT', '74', 'Determination of Tax Not Paid - Fraud Cases',
'Where tax not paid due to fraud, willful misstatement, suppression of facts.',
'Tax + Interest + 100% penalty (mandatory); if paid before SCN = 15% penalty', 'Mandatory 100% of tax',
ARRAY['fraud', 'suppression', 'willful misstatement', 'SCN', 'demand'],
'Fraud/suppression cases. 5-year limitation. Minimum 100% penalty, no option to settle at lower rate after SCN.')

ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    punishment = EXCLUDED.punishment,
    "businessRelevance" = EXCLUDED."businessRelevance",
    "updatedAt" = CURRENT_TIMESTAMP;

-- =============================================================================
-- 7. ADD LEGAL TEMPLATES FOR CHEQUE BOUNCE
-- =============================================================================

INSERT INTO compliance."LegalTemplate" (id, "sectionId", name, type, description, template, variables) VALUES

('TEMPLATE_138_NOTICE', 'NI_138', 'Legal Notice for Cheque Bounce', 'NOTICE',
'Standard legal notice to be sent within 30 days of cheque bounce',
'LEGAL NOTICE

To,
{{drawer_name}}
{{drawer_address}}

Subject: Legal Notice under Section 138 of Negotiable Instruments Act, 1881

Under instructions from my client {{payee_name}}, I hereby serve upon you the following Legal Notice:

1. That you had issued Cheque No. {{cheque_number}} dated {{cheque_date}} for Rs. {{amount}}/- (Rupees {{amount_in_words}} Only) drawn on {{bank_name}}, {{branch_name}} branch, in favour of my client towards {{purpose_of_cheque}}.

2. That the said cheque was presented by my client for encashment on {{presentation_date}} through {{payee_bank_name}}, but the same was returned unpaid with the remarks "{{return_reason}}" vide Return Memo dated {{memo_date}}.

3. That you are legally bound to pay the said amount, and your failure to honour the cheque is an offence punishable under Section 138 of the Negotiable Instruments Act, 1881.

4. You are hereby called upon to pay the sum of Rs. {{amount}}/- (Rupees {{amount_in_words}} Only) within 15 days of receipt of this notice, failing which my client shall be constrained to initiate criminal proceedings against you under Section 138 of the N.I. Act, 1881, and you shall be liable to pay:
   a) Imprisonment up to 2 years; AND/OR
   b) Fine up to twice the amount of the cheque; AND
   c) Compensation to the complainant; AND
   d) All costs of legal proceedings.

5. Please note that this notice is being sent without prejudice to my client''s rights and remedies under law.

{{city}}
Date: {{notice_date}}

{{advocate_name}}
Advocate
{{advocate_address}}
{{advocate_phone}}',
ARRAY['drawer_name', 'drawer_address', 'payee_name', 'cheque_number', 'cheque_date', 'amount', 'amount_in_words', 'bank_name', 'branch_name', 'purpose_of_cheque', 'presentation_date', 'payee_bank_name', 'return_reason', 'memo_date', 'city', 'notice_date', 'advocate_name', 'advocate_address', 'advocate_phone']),

('TEMPLATE_138_REPLY', 'NI_138', 'Reply to Cheque Bounce Notice', 'REPLY',
'Template for replying to a cheque bounce legal notice',
'REPLY TO LEGAL NOTICE

To,
{{sender_name}}
{{sender_address}}

Subject: Reply to your Legal Notice dated {{notice_date}} under Section 138 N.I. Act

Dear Sir/Madam,

Reference is made to your Legal Notice dated {{notice_date}} received by me/us on {{receipt_date}}.

The contents of your notice are denied in toto except those specifically admitted herein.

{{reply_grounds}}

In view of the above, your client is not entitled to any relief as claimed in the notice. The allegations made in your notice are false, frivolous, and without any basis in law or fact.

Any legal proceeding initiated based on false allegations will be defended appropriately, and my/our right to claim damages for harassment and defamation is expressly reserved.

{{city}}
Date: {{reply_date}}

{{respondent_name}}
{{respondent_address}}',
ARRAY['sender_name', 'sender_address', 'notice_date', 'receipt_date', 'reply_grounds', 'city', 'reply_date', 'respondent_name', 'respondent_address'])

ON CONFLICT (id) DO UPDATE SET
    template = EXCLUDED.template,
    variables = EXCLUDED.variables;

-- =============================================================================
-- 8. SUMMARY
-- =============================================================================

SELECT 'Legal Knowledge Base Created Successfully!' as status;

SELECT 'Acts:' as category, COUNT(*) as count FROM compliance."LegalAct"
UNION ALL
SELECT 'Sections:' as category, COUNT(*) as count FROM compliance."LegalSection"
UNION ALL
SELECT 'Templates:' as category, COUNT(*) as count FROM compliance."LegalTemplate";
