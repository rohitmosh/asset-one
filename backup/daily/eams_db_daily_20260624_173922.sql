--
-- PostgreSQL database dump
--

\restrict FoJU66SwNMfGr3wVGpSkf18QbbEJxp5UXXOhUX9bjuOlCuiCDXR5queZ3fIFodu

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: eams_admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO eams_admin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: eams_admin
--

COMMENT ON SCHEMA public IS '';


--
-- Name: prevent_audit_log_modification(); Type: FUNCTION; Schema: public; Owner: eams_admin
--

CREATE FUNCTION public.prevent_audit_log_modification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
                BEGIN
                    RAISE EXCEPTION 'Non-repudiation alert: UPDATES and DELETIONS are strictly forbidden on asset_audit_log.';
                END;
                $$;


ALTER FUNCTION public.prevent_audit_log_modification() OWNER TO eams_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asset_audit_log; Type: TABLE; Schema: public; Owner: eams_admin
--

CREATE TABLE public.asset_audit_log (
    id integer NOT NULL,
    asset_instance_id integer,
    action character varying(50) NOT NULL,
    changed_by_user_id integer NOT NULL,
    changed_by_name character varying(100) NOT NULL,
    changed_by_role character varying(50) NOT NULL,
    changed_at timestamp with time zone NOT NULL,
    ip_address character varying(50),
    field_diffs text,
    prev_hash character varying(64),
    row_hash character varying(64) NOT NULL
);


ALTER TABLE public.asset_audit_log OWNER TO eams_admin;

--
-- Name: asset_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: eams_admin
--

CREATE SEQUENCE public.asset_audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_audit_log_id_seq OWNER TO eams_admin;

--
-- Name: asset_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eams_admin
--

ALTER SEQUENCE public.asset_audit_log_id_seq OWNED BY public.asset_audit_log.id;


--
-- Name: asset_groups; Type: TABLE; Schema: public; Owner: eams_admin
--

CREATE TABLE public.asset_groups (
    id integer NOT NULL,
    domain character varying(10) NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.asset_groups OWNER TO eams_admin;

--
-- Name: asset_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: eams_admin
--

CREATE SEQUENCE public.asset_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_groups_id_seq OWNER TO eams_admin;

--
-- Name: asset_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eams_admin
--

ALTER SEQUENCE public.asset_groups_id_seq OWNED BY public.asset_groups.id;


--
-- Name: asset_instances; Type: TABLE; Schema: public; Owner: eams_admin
--

CREATE TABLE public.asset_instances (
    id integer NOT NULL,
    asset_id integer NOT NULL,
    identifier character varying(100) NOT NULL,
    description text,
    manufacturer character varying(100),
    model_number character varying(100),
    serial_number character varying(100),
    owner_id integer NOT NULL,
    custodian_id integer NOT NULL,
    assigned_user_id integer,
    location_id integer NOT NULL,
    security_classification character varying(50) NOT NULL,
    business_criticality character varying(50) NOT NULL,
    purchase_date date,
    installation_date date,
    warranty_start_date date,
    warranty_end_date date,
    end_of_life_date date,
    end_of_support_date date,
    policy_deviations text,
    known_vulnerabilities text,
    remarks text,
    backup_available boolean,
    backup_location character varying(255),
    backup_owner_id integer,
    status character varying(50),
    prev_asset_instance_id integer
);


ALTER TABLE public.asset_instances OWNER TO eams_admin;

--
-- Name: asset_instances_id_seq; Type: SEQUENCE; Schema: public; Owner: eams_admin
--

CREATE SEQUENCE public.asset_instances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_instances_id_seq OWNER TO eams_admin;

--
-- Name: asset_instances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eams_admin
--

ALTER SEQUENCE public.asset_instances_id_seq OWNED BY public.asset_instances.id;


--
-- Name: asset_transfers; Type: TABLE; Schema: public; Owner: eams_admin
--

CREATE TABLE public.asset_transfers (
    id integer NOT NULL,
    asset_instance_id integer NOT NULL,
    transfer_date timestamp with time zone NOT NULL,
    from_user_id integer,
    to_user_id integer NOT NULL,
    from_location_id integer,
    to_location_id integer NOT NULL,
    reason text,
    changed_by_user_id integer NOT NULL
);


ALTER TABLE public.asset_transfers OWNER TO eams_admin;

--
-- Name: asset_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: eams_admin
--

CREATE SEQUENCE public.asset_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_transfers_id_seq OWNER TO eams_admin;

--
-- Name: asset_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eams_admin
--

ALTER SEQUENCE public.asset_transfers_id_seq OWNED BY public.asset_transfers.id;


--
-- Name: asset_types; Type: TABLE; Schema: public; Owner: eams_admin
--

CREATE TABLE public.asset_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.asset_types OWNER TO eams_admin;

--
-- Name: asset_types_id_seq; Type: SEQUENCE; Schema: public; Owner: eams_admin
--

CREATE SEQUENCE public.asset_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_types_id_seq OWNER TO eams_admin;

--
-- Name: asset_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eams_admin
--

ALTER SEQUENCE public.asset_types_id_seq OWNED BY public.asset_types.id;


--
-- Name: assets; Type: TABLE; Schema: public; Owner: eams_admin
--

CREATE TABLE public.assets (
    id integer NOT NULL,
    asset_group_id integer NOT NULL,
    asset_type_id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.assets OWNER TO eams_admin;

--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: eams_admin
--

CREATE SEQUENCE public.assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assets_id_seq OWNER TO eams_admin;

--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eams_admin
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: eams_admin
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    plant_office character varying(100) NOT NULL,
    building character varying(100) NOT NULL,
    floor character varying(50),
    room character varying(50),
    rack character varying(50)
);


ALTER TABLE public.locations OWNER TO eams_admin;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: eams_admin
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO eams_admin;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eams_admin
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: registry_snapshots; Type: TABLE; Schema: public; Owner: eams_admin
--

CREATE TABLE public.registry_snapshots (
    id integer NOT NULL,
    snapshot_id character varying(36) NOT NULL,
    signer_user_id integer NOT NULL,
    signer_name character varying(100) NOT NULL,
    signer_role character varying(50) NOT NULL,
    signer_employee_id character varying(50) NOT NULL,
    signer_department character varying(100) NOT NULL,
    signer_email character varying(100) NOT NULL,
    timestamp_ist timestamp with time zone NOT NULL,
    asset_count integer NOT NULL,
    data_hash character varying(64) NOT NULL,
    chain_anchor character varying(64) NOT NULL,
    hmac_signature character varying(64) NOT NULL,
    remarks text
);


ALTER TABLE public.registry_snapshots OWNER TO eams_admin;

--
-- Name: registry_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: eams_admin
--

CREATE SEQUENCE public.registry_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.registry_snapshots_id_seq OWNER TO eams_admin;

--
-- Name: registry_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eams_admin
--

ALTER SEQUENCE public.registry_snapshots_id_seq OWNED BY public.registry_snapshots.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: eams_admin
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    permissions text
);


ALTER TABLE public.roles OWNER TO eams_admin;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: eams_admin
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO eams_admin;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eams_admin
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: eams_admin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    role_id integer NOT NULL,
    department character varying(100) NOT NULL,
    employee_id character varying(50) NOT NULL
);


ALTER TABLE public.users OWNER TO eams_admin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: eams_admin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO eams_admin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eams_admin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: asset_audit_log id; Type: DEFAULT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_audit_log ALTER COLUMN id SET DEFAULT nextval('public.asset_audit_log_id_seq'::regclass);


--
-- Name: asset_groups id; Type: DEFAULT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_groups ALTER COLUMN id SET DEFAULT nextval('public.asset_groups_id_seq'::regclass);


--
-- Name: asset_instances id; Type: DEFAULT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_instances ALTER COLUMN id SET DEFAULT nextval('public.asset_instances_id_seq'::regclass);


--
-- Name: asset_transfers id; Type: DEFAULT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_transfers ALTER COLUMN id SET DEFAULT nextval('public.asset_transfers_id_seq'::regclass);


--
-- Name: asset_types id; Type: DEFAULT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_types ALTER COLUMN id SET DEFAULT nextval('public.asset_types_id_seq'::regclass);


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: registry_snapshots id; Type: DEFAULT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.registry_snapshots ALTER COLUMN id SET DEFAULT nextval('public.registry_snapshots_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: asset_audit_log; Type: TABLE DATA; Schema: public; Owner: eams_admin
--

COPY public.asset_audit_log (id, asset_instance_id, action, changed_by_user_id, changed_by_name, changed_by_role, changed_at, ip_address, field_diffs, prev_hash, row_hash) FROM stdin;
1	1	CREATE	1	Rajan Patel	L1_ADMIN	2026-06-23 16:15:33.944081+00	127.0.0.1	{"identifier": [null, "OHPC-IT-CORP-ROUTE-00001"], "status": [null, "Retired"]}	0000000000000000000000000000000000000000000000000000000000000000	9ddfb858f6076fbb0bcbe90ac4e414822fb473d9707ac892e04b1044db991faf
2	2	CREATE	1	Rajan Patel	L1_ADMIN	2026-06-23 16:15:33.945672+00	127.0.0.1	{"identifier": [null, "RENG-OT-POWE-PLCXX-00001"], "status": [null, "Retired"]}	9ddfb858f6076fbb0bcbe90ac4e414822fb473d9707ac892e04b1044db991faf	17dc2eb93b75a41a46384898a21a38fae7bd17e08b0a10190d256d8b00972bfb
3	3	CREATE	1	Rajan Patel	L1_ADMIN	2026-06-23 16:15:33.946086+00	127.0.0.1	{"identifier": [null, "OHPC-IT-CORP-ROUTE-00002"], "status": [null, "Active"]}	17dc2eb93b75a41a46384898a21a38fae7bd17e08b0a10190d256d8b00972bfb	e210d306bfb07da709cd9e15c8d78dda23db0bda71b46b56ef068a0f83fdf9c6
4	4	CREATE	2	Aravind Sharma	L2_ADMIN	2026-06-23 16:15:33.946451+00	127.0.0.1	{"identifier": [null, "OHPC-IT-CORP-LAPTO-00001"], "status": [null, "Active"]}	e210d306bfb07da709cd9e15c8d78dda23db0bda71b46b56ef068a0f83fdf9c6	3ec81f3870d190decbdc651fdd8920c801d7c38d725bf3076888c85ae23b29fc
5	5	CREATE	3	Satish Mohanty	L2_ADMIN	2026-06-23 16:15:33.947021+00	127.0.0.1	{"identifier": [null, "RENG-OT-POWE-PLCXX-00002"], "status": [null, "Active"]}	3ec81f3870d190decbdc651fdd8920c801d7c38d725bf3076888c85ae23b29fc	26df2bb11045a4e8d704d58fd7cd298e582de72e151671b63e555c59c7d4099e
6	6	CREATE	1	Rajan Patel	L1_ADMIN	2026-06-23 16:15:33.947479+00	127.0.0.1	{"identifier": [null, "OHPC-OT-CORP-DATAS-00001"], "status": [null, "Active"]}	26df2bb11045a4e8d704d58fd7cd298e582de72e151671b63e555c59c7d4099e	9c6c327e6ac31bac24b7ef386bed6fbe8876cf47b5459260c779ea08157a6367
7	7	CREATE	2	Aravind Sharma	L2_ADMIN	2026-06-23 16:15:33.947823+00	127.0.0.1	{"identifier": [null, "OHPC-IT-CORP-APPLI-00001"], "status": [null, "Active"]}	9c6c327e6ac31bac24b7ef386bed6fbe8876cf47b5459260c779ea08157a6367	ba1a751c15122e2746adba9dc32166701cde6ff7c57c8713028f7edfecb452e8
8	8	CREATE	1	Rajan Patel	L1_ADMIN	2026-06-23 16:15:33.948164+00	127.0.0.1	{"identifier": [null, "OHPC-IT-CORP-ANTIV-00001"], "status": [null, "Active"]}	ba1a751c15122e2746adba9dc32166701cde6ff7c57c8713028f7edfecb452e8	159ceb85c7f0bcf3eec02eca174e0a0145d9d793fd955f617287504862f1d389
9	9	CREATE	2	Aravind Sharma	L2_ADMIN	2026-06-23 16:15:43.122468+00	127.0.0.1	{"identifier": [null, "RENG-IT-POWE-BLADE-00001"], "status": [null, "Active"]}	159ceb85c7f0bcf3eec02eca174e0a0145d9d793fd955f617287504862f1d389	eb53b85226333260ea711822826c032717573c5df084b8c3fc693d0d62341fc6
10	10	CREATE	2	Aravind Sharma	L2_ADMIN	2026-06-23 16:15:48.171266+00	127.0.0.1	{"identifier": [null, "OHPC-IT-BLADESERVER-1782231348"], "status": [null, "Active"]}	eb53b85226333260ea711822826c032717573c5df084b8c3fc693d0d62341fc6	d5192584da3e90063176003c7a188958f31a4c6d078a98b05c75de606ff34192
11	11	CREATE	2	Aravind Sharma	L2_ADMIN	2026-06-23 16:54:55.052659+00	127.0.0.1	{"identifier": [null, "RENG-IT-POWE-BLADE-00003"], "status": [null, "Active"]}	d5192584da3e90063176003c7a188958f31a4c6d078a98b05c75de606ff34192	686cbccb8f1d671c2dbe8d52b01523222e628ed5ed556053e4c9639f8aa30baf
12	12	CREATE	2	Aravind Sharma	L2_ADMIN	2026-06-23 16:55:06.128386+00	127.0.0.1	{"identifier": [null, "OHPC-IT-BLADESERVER-1782233706"], "status": [null, "Active"]}	686cbccb8f1d671c2dbe8d52b01523222e628ed5ed556053e4c9639f8aa30baf	ca3f3035d9a7c865a139f415129aa43b783a8ea12acf26463c38586cbdb46a44
\.


--
-- Data for Name: asset_groups; Type: TABLE DATA; Schema: public; Owner: eams_admin
--

COPY public.asset_groups (id, domain, name) FROM stdin;
1	IT	Server Systems
2	IT	Network Appliances
3	IT	Security Appliances
4	IT	Storage Appliances
5	IT	Workstations
6	IT	Computers
7	IT	Smart Phones
8	IT	Tablets
9	IT	Others
10	IT	Operating System
11	IT	Utility Software
12	IT	Server Application
13	IT	System/Software Developed
14	OT	Control Systems
15	OT	Communication Infrastructure
16	OT	Power Generation Equipment
17	OT	Physical Security Systems
18	OT	Monitoring and Measurement Devices
19	OT	Emergency Systems
20	OT	Environmental Monitoring Assets
21	OT	Electrical Distribution Assets
22	OT	Data Storage and Backup Systems
23	OT	Power House Auxiliaries
24	OT	Others
25	OT	Applications
\.


--
-- Data for Name: asset_instances; Type: TABLE DATA; Schema: public; Owner: eams_admin
--

COPY public.asset_instances (id, asset_id, identifier, description, manufacturer, model_number, serial_number, owner_id, custodian_id, assigned_user_id, location_id, security_classification, business_criticality, purchase_date, installation_date, warranty_start_date, warranty_end_date, end_of_life_date, end_of_support_date, policy_deviations, known_vulnerabilities, remarks, backup_available, backup_location, backup_owner_id, status, prev_asset_instance_id) FROM stdin;
1	4	OHPC-IT-CORP-ROUTE-00001	Retired edge router corporate office	Cisco Systems	Catalyst 2900	CSCO-11223-Z1	1	2	\N	1	Internal	Low	2022-05-15	2022-05-25	\N	2025-02-08	\N	\N	\N	\N	\N	f	\N	\N	Retired	\N
2	35	RENG-OT-POWE-PLCXX-00001	Decommissioned Unit 1 PLC	Siemens	S7-300	SIE-PLC-10023	1	3	\N	4	Restricted	Medium	2020-12-31	2021-01-10	\N	2023-09-27	\N	\N	\N	\N	\N	f	\N	\N	Retired	\N
4	19	OHPC-IT-CORP-LAPTO-00001	Standard Developer Laptop	Dell Inc.	Latitude 5430	DELL-LAT-87352	1	2	4	2	Internal	Medium	2025-06-23	2025-06-28	2025-06-28	2026-07-27	2030-04-23	\N	\N	\N	\N	f	\N	\N	Active	\N
6	70	OHPC-OT-CORP-DATAS-00001	Host hypervisor for legacy apps	HP Enterprise	ProLiant BL460c Gen10	HPE-BL-992147	1	2	\N	1	Confidential	High	2022-05-15	2022-05-25	2022-05-25	2026-05-09	2026-06-13	2026-06-13	\N	\N	\N	t	Offsite Tape Vault	1	Active	\N
7	30	OHPC-IT-CORP-APPLI-00001	Corporate Office license bundle	Microsoft	Office 2019 LTSC	MS-O365-LIC-5542	1	2	4	2	Public	Low	2025-05-19	2025-05-19	2025-05-19	2026-05-19	\N	\N	\N	\N	\N	f	\N	\N	Active	\N
8	27	OHPC-IT-CORP-ANTIV-00001	Endpoint Antivirus Agents	QuickHeal Enterprise	v18.0	QH-AV-MOCK-LIC	1	2	\N	1	Internal	Medium	2026-03-15	\N	2026-03-15	2027-01-09	\N	\N	\N	\N	\N	f	\N	\N	Active	\N
9	1	RENG-IT-POWE-BLADE-00001	Integration test created asset	Dell	Optiplex	INTEG-TEST-SN-999	5	6	4	6	Internal	Medium	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	Active	\N
3	4	OHPC-IT-CORP-ROUTE-00002	Main corporate backbone router	Cisco Systems	Catalyst 8300	CSCO-99824-A3	1	2	4	1	Restricted	High	2024-07-23	2024-07-28	2024-07-28	2026-07-21	2029-03-19	2029-10-05	\N	\N	\N	t	TFTP Server HQ-Backup-01	2	Active	1
5	35	RENG-OT-POWE-PLCXX-00002	Control Unit 3 Main PLC	Siemens	S7-1500	SIE-PLC-302482	1	3	\N	4	Restricted	High	2025-12-25	2025-12-30	2025-12-30	2027-12-20	2031-12-14	2032-07-01	\N	\N	\N	t	Master SCADA Storage Room 3	3	Active	2
10	1	OHPC-IT-BLADESERVER-1782231348	Test Blade Server for verification	Dell	Precision T5820	SN-TEST-1782231348	1	2	\N	1	Confidential	Medium	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	NAS-TEST-BAK	\N	Active	9
11	1	RENG-IT-POWE-BLADE-00003	Integration test created asset	Dell	Optiplex	INTEG-TEST-SN-999	5	6	4	6	Internal	Medium	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	Active	10
12	1	OHPC-IT-BLADESERVER-1782233706	Test Blade Server for verification	Dell	Precision T5820	SN-TEST-1782233706	1	2	\N	1	Confidential	Medium	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	NAS-TEST-BAK	\N	Active	11
\.


--
-- Data for Name: asset_transfers; Type: TABLE DATA; Schema: public; Owner: eams_admin
--

COPY public.asset_transfers (id, asset_instance_id, transfer_date, from_user_id, to_user_id, from_location_id, to_location_id, reason, changed_by_user_id) FROM stdin;
\.


--
-- Data for Name: asset_types; Type: TABLE DATA; Schema: public; Owner: eams_admin
--

COPY public.asset_types (id, name) FROM stdin;
1	Hardware
2	Software
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: eams_admin
--

COPY public.assets (id, asset_group_id, asset_type_id, name) FROM stdin;
1	1	1	Blade Server
2	1	1	Rack Server
3	2	1	Gateway
4	2	1	Router/L3 Switch
5	2	1	L2 Switch
6	2	1	Firewall
7	2	1	MPLS
8	2	1	OPGW
9	2	1	ILL
10	2	1	Modem
11	2	1	Media Converter
12	3	1	Firewall
13	3	1	Smart Cards
14	4	1	Network Access Storage
15	5	1	Engineering Station
16	5	1	Operating Station
17	5	1	Desktop PC
18	6	1	Desktop PC
19	6	1	Laptops
20	7	1	Mobile Device
21	8	1	Mobile Device
22	9	1	Device Server
23	9	1	Serial Device Server
24	9	1	Printer
25	9	1	Display Unit
26	10	2	Operating System Image
27	11	2	Antivirus
28	11	2	Backup Application
29	11	2	Configuration Details
30	12	2	Application Software
31	13	2	Custom Applications
32	14	1	SCADA Servers
33	14	1	HMI
34	14	1	RTU
35	14	1	PLC
36	14	1	Servers
37	14	1	Operator Workstations
38	14	1	Engineering Workstations
39	15	1	Communication Networks
40	15	1	Routers
41	15	1	Network Switches
42	15	1	Communication Protocols
43	15	1	Firewalls
44	15	1	Media Converter
45	15	1	PLCC
46	16	1	Turbines
47	16	1	Generators
48	16	1	Pumps
49	16	1	Transformers
50	17	1	Perimeter Security Systems
51	17	1	Access Control Systems
52	17	1	CCTV
53	17	1	Intrusion Detection Systems
54	18	1	Sensors
55	18	1	Cameras
56	18	1	Vibration Monitoring Devices
57	18	1	Meters
58	18	1	Transmitters
59	19	1	Emergency Power Systems
60	19	1	Emergency Shutdown Systems
61	19	1	Alarm and Notification Systems
62	19	1	FDA
63	19	1	FPS
64	19	1	Protection System
65	20	1	Weather Stations
66	20	1	Water Quality Sensors
67	21	1	Substation Equipment
68	21	1	Switchgear
69	21	1	Electrical Panels
70	22	1	Data Storage Devices
71	22	1	Backup Systems
72	23	1	Cooling Water System
73	23	1	Auxiliary Supply System
74	23	1	Illumination System
75	23	1	OPU System
76	23	1	Drainage and Dewatering System
77	23	1	Compressed Air System
78	24	1	Others
79	25	2	Control System Software
80	25	2	Operating System
81	25	2	Application Software
82	25	2	Antivirus Software
83	25	2	Others
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: eams_admin
--

COPY public.locations (id, plant_office, building, floor, room, rack) FROM stdin;
1	OHPC Corporate Office	Corporate HQ	2	IT Server Room	Rack B1
2	OHPC Corporate Office	Corporate HQ	2	Operations Dept	N/A
3	OHPC Corporate Office	Corporate HQ	3	Executive Floor	N/A
4	Rengali Hydro Project	Power House Unit 1	Ground Floor	Control Room	Control Panel 2
5	Rengali Hydro Project	Power House Unit 1	Ground Floor	Turbine Hall	N/A
6	Rengali Hydro Project	Power House	N/A	N/A	N/A
\.


--
-- Data for Name: registry_snapshots; Type: TABLE DATA; Schema: public; Owner: eams_admin
--

COPY public.registry_snapshots (id, snapshot_id, signer_user_id, signer_name, signer_role, signer_employee_id, signer_department, signer_email, timestamp_ist, asset_count, data_hash, chain_anchor, hmac_signature, remarks) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: eams_admin
--

COPY public.roles (id, name, permissions) FROM stdin;
1	L1_ADMIN	full_read,admin_settings
2	L2_ADMIN	full_read,full_write,full_delete,admin_settings
3	USER	assigned_read
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: eams_admin
--

COPY public.users (id, username, password_hash, name, email, role_id, department, employee_id) FROM stdin;
1	admin.hq	8d809c08c2d9e9ee1d9d6b594f581cc6:17d25765f677c1a7b0ac8eb86c2294336f025c986aedf375925dc08492eb5f08	Rajan Patel	r.patel@ohpc.in	1	Information Technology	EMP001
2	custodian.it	8d809c08c2d9e9ee1d9d6b594f581cc6:17d25765f677c1a7b0ac8eb86c2294336f025c986aedf375925dc08492eb5f08	Aravind Sharma	a.sharma@ohpc.in	2	IT Infrastructure	EMP042
3	custodian.ot	8d809c08c2d9e9ee1d9d6b594f581cc6:17d25765f677c1a7b0ac8eb86c2294336f025c986aedf375925dc08492eb5f08	Satish Mohanty	s.mohanty@ohpc.in	2	OT/SCADA Systems	EMP085
4	rahul.ops	8d809c08c2d9e9ee1d9d6b594f581cc6:17d25765f677c1a7b0ac8eb86c2294336f025c986aedf375925dc08492eb5f08	Rahul Sharma	rahul.sharma@ohpc.in	3	Operations	EMP108
5	jane.owner.auto	6b254f38289c5d104c4ea586ad6afa53:fde8be919b30dac4c4c490e4b2fc2d1bc17e2d3da371582f014ba1a33a2d14f1	Jane Owner Auto	jane.owner.auto@ohpc.in	3	Management	EMP2623
6	john.custodian.auto	578cd9c271d6294ce7d6d8da511433a9:d9dbe53250d62c540ee8fc525913bc84adbe12eaf76602245a9e66ff90867f44	John Custodian Auto	john.custodian.auto@ohpc.in	2	IT Infrastructure	EMP9439
\.


--
-- Name: asset_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eams_admin
--

SELECT pg_catalog.setval('public.asset_audit_log_id_seq', 12, true);


--
-- Name: asset_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eams_admin
--

SELECT pg_catalog.setval('public.asset_groups_id_seq', 25, true);


--
-- Name: asset_instances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eams_admin
--

SELECT pg_catalog.setval('public.asset_instances_id_seq', 12, true);


--
-- Name: asset_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eams_admin
--

SELECT pg_catalog.setval('public.asset_transfers_id_seq', 1, false);


--
-- Name: asset_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eams_admin
--

SELECT pg_catalog.setval('public.asset_types_id_seq', 2, true);


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eams_admin
--

SELECT pg_catalog.setval('public.assets_id_seq', 83, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eams_admin
--

SELECT pg_catalog.setval('public.locations_id_seq', 6, true);


--
-- Name: registry_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eams_admin
--

SELECT pg_catalog.setval('public.registry_snapshots_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eams_admin
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eams_admin
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: asset_audit_log asset_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_audit_log
    ADD CONSTRAINT asset_audit_log_pkey PRIMARY KEY (id);


--
-- Name: asset_groups asset_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_groups
    ADD CONSTRAINT asset_groups_pkey PRIMARY KEY (id);


--
-- Name: asset_instances asset_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_instances
    ADD CONSTRAINT asset_instances_pkey PRIMARY KEY (id);


--
-- Name: asset_transfers asset_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT asset_transfers_pkey PRIMARY KEY (id);


--
-- Name: asset_types asset_types_name_key; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_types
    ADD CONSTRAINT asset_types_name_key UNIQUE (name);


--
-- Name: asset_types asset_types_pkey; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_types
    ADD CONSTRAINT asset_types_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: registry_snapshots registry_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.registry_snapshots
    ADD CONSTRAINT registry_snapshots_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_id_key UNIQUE (employee_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_asset_audit_log_id; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE INDEX ix_asset_audit_log_id ON public.asset_audit_log USING btree (id);


--
-- Name: ix_asset_groups_id; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE INDEX ix_asset_groups_id ON public.asset_groups USING btree (id);


--
-- Name: ix_asset_instances_id; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE INDEX ix_asset_instances_id ON public.asset_instances USING btree (id);


--
-- Name: ix_asset_instances_identifier; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE UNIQUE INDEX ix_asset_instances_identifier ON public.asset_instances USING btree (identifier);


--
-- Name: ix_asset_transfers_id; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE INDEX ix_asset_transfers_id ON public.asset_transfers USING btree (id);


--
-- Name: ix_asset_types_id; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE INDEX ix_asset_types_id ON public.asset_types USING btree (id);


--
-- Name: ix_assets_id; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE INDEX ix_assets_id ON public.assets USING btree (id);


--
-- Name: ix_locations_id; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE INDEX ix_locations_id ON public.locations USING btree (id);


--
-- Name: ix_registry_snapshots_id; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE INDEX ix_registry_snapshots_id ON public.registry_snapshots USING btree (id);


--
-- Name: ix_registry_snapshots_snapshot_id; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE UNIQUE INDEX ix_registry_snapshots_snapshot_id ON public.registry_snapshots USING btree (snapshot_id);


--
-- Name: ix_roles_id; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE INDEX ix_roles_id ON public.roles USING btree (id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: eams_admin
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: asset_audit_log audit_no_delete; Type: TRIGGER; Schema: public; Owner: eams_admin
--

CREATE TRIGGER audit_no_delete BEFORE DELETE ON public.asset_audit_log FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();


--
-- Name: asset_audit_log audit_no_update; Type: TRIGGER; Schema: public; Owner: eams_admin
--

CREATE TRIGGER audit_no_update BEFORE UPDATE ON public.asset_audit_log FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();


--
-- Name: asset_audit_log asset_audit_log_asset_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_audit_log
    ADD CONSTRAINT asset_audit_log_asset_instance_id_fkey FOREIGN KEY (asset_instance_id) REFERENCES public.asset_instances(id) ON DELETE CASCADE;


--
-- Name: asset_audit_log asset_audit_log_changed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_audit_log
    ADD CONSTRAINT asset_audit_log_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id);


--
-- Name: asset_instances asset_instances_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_instances
    ADD CONSTRAINT asset_instances_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: asset_instances asset_instances_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_instances
    ADD CONSTRAINT asset_instances_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(id);


--
-- Name: asset_instances asset_instances_backup_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_instances
    ADD CONSTRAINT asset_instances_backup_owner_id_fkey FOREIGN KEY (backup_owner_id) REFERENCES public.users(id);


--
-- Name: asset_instances asset_instances_custodian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_instances
    ADD CONSTRAINT asset_instances_custodian_id_fkey FOREIGN KEY (custodian_id) REFERENCES public.users(id);


--
-- Name: asset_instances asset_instances_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_instances
    ADD CONSTRAINT asset_instances_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: asset_instances asset_instances_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_instances
    ADD CONSTRAINT asset_instances_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: asset_instances asset_instances_prev_asset_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_instances
    ADD CONSTRAINT asset_instances_prev_asset_instance_id_fkey FOREIGN KEY (prev_asset_instance_id) REFERENCES public.asset_instances(id);


--
-- Name: asset_transfers asset_transfers_asset_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT asset_transfers_asset_instance_id_fkey FOREIGN KEY (asset_instance_id) REFERENCES public.asset_instances(id) ON DELETE CASCADE;


--
-- Name: asset_transfers asset_transfers_changed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT asset_transfers_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id);


--
-- Name: asset_transfers asset_transfers_from_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT asset_transfers_from_location_id_fkey FOREIGN KEY (from_location_id) REFERENCES public.locations(id);


--
-- Name: asset_transfers asset_transfers_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT asset_transfers_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id);


--
-- Name: asset_transfers asset_transfers_to_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT asset_transfers_to_location_id_fkey FOREIGN KEY (to_location_id) REFERENCES public.locations(id);


--
-- Name: asset_transfers asset_transfers_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT asset_transfers_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id);


--
-- Name: assets assets_asset_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_asset_group_id_fkey FOREIGN KEY (asset_group_id) REFERENCES public.asset_groups(id);


--
-- Name: assets assets_asset_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_asset_type_id_fkey FOREIGN KEY (asset_type_id) REFERENCES public.asset_types(id);


--
-- Name: registry_snapshots registry_snapshots_signer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.registry_snapshots
    ADD CONSTRAINT registry_snapshots_signer_user_id_fkey FOREIGN KEY (signer_user_id) REFERENCES public.users(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eams_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: eams_admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict FoJU66SwNMfGr3wVGpSkf18QbbEJxp5UXXOhUX9bjuOlCuiCDXR5queZ3fIFodu

