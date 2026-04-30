--
-- PostgreSQL database dump
--

\restrict vkCOlpOx8h5xe2eCuIesyIB0sSAwbG7bNqeLLLi2quxiVZE7dkQvxgbeVLPnXJH

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: lesson_block_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lesson_block_type AS ENUM (
    'theory',
    'staff_example',
    'piano_example',
    'quiz',
    'ear_training',
    'piano_performance',
    'transcription'
);


--
-- Name: lesson_tab_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lesson_tab_type AS ENUM (
    'theory',
    'test',
    'transcription'
);


--
-- Name: progress_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.progress_status AS ENUM (
    'locked',
    'available',
    'completed'
);


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ear_training_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ear_training_blocks (
    block_id bigint NOT NULL,
    prompt_text text,
    config_json jsonb NOT NULL
);


--
-- Name: ear_training_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ear_training_options (
    id bigint NOT NULL,
    ear_training_block_id bigint NOT NULL,
    option_text character varying(255) NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    "position" integer NOT NULL
);


--
-- Name: ear_training_options_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ear_training_options_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ear_training_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ear_training_options_id_seq OWNED BY public.ear_training_options.id;


--
-- Name: lesson_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_blocks (
    id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    tab_type public.lesson_tab_type NOT NULL,
    block_type public.lesson_block_type NOT NULL,
    title character varying(255),
    "position" integer NOT NULL,
    is_required boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_lesson_block_tab_match CHECK ((((tab_type = 'theory'::public.lesson_tab_type) AND (block_type = ANY (ARRAY['theory'::public.lesson_block_type, 'staff_example'::public.lesson_block_type, 'piano_example'::public.lesson_block_type]))) OR ((tab_type = 'test'::public.lesson_tab_type) AND (block_type = ANY (ARRAY['quiz'::public.lesson_block_type, 'ear_training'::public.lesson_block_type, 'piano_performance'::public.lesson_block_type]))) OR ((tab_type = 'transcription'::public.lesson_tab_type) AND (block_type = 'transcription'::public.lesson_block_type))))
);


--
-- Name: lesson_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lesson_blocks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lesson_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lesson_blocks_id_seq OWNED BY public.lesson_blocks.id;


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id bigint NOT NULL,
    topic_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lessons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;


--
-- Name: piano_example_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.piano_example_blocks (
    block_id bigint NOT NULL,
    content_json jsonb NOT NULL,
    description text
);


--
-- Name: piano_performance_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.piano_performance_blocks (
    block_id bigint NOT NULL,
    instruction_text text,
    expected_json jsonb NOT NULL
);


--
-- Name: quiz_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_blocks (
    block_id bigint NOT NULL
);


--
-- Name: quiz_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_options (
    id bigint NOT NULL,
    question_id bigint NOT NULL,
    option_text text NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    "position" integer NOT NULL
);


--
-- Name: quiz_options_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_options_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_options_id_seq OWNED BY public.quiz_options.id;


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_questions (
    id bigint NOT NULL,
    quiz_block_id bigint NOT NULL,
    question_text text NOT NULL,
    explanation text,
    "position" integer NOT NULL
);


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_questions_id_seq OWNED BY public.quiz_questions.id;


--
-- Name: staff_example_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_example_blocks (
    block_id bigint NOT NULL,
    content_json jsonb NOT NULL,
    audio_json jsonb,
    description text
);


--
-- Name: theory_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theory_blocks (
    block_id bigint NOT NULL,
    content_json jsonb NOT NULL
);


--
-- Name: topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.topics (
    id bigint NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: topics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.topics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.topics_id_seq OWNED BY public.topics.id;


--
-- Name: transcription_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transcription_blocks (
    block_id bigint NOT NULL,
    instruction_text text,
    expected_json jsonb NOT NULL
);


--
-- Name: user_ear_training_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_ear_training_answers (
    id bigint NOT NULL,
    test_result_id bigint NOT NULL,
    ear_training_block_id bigint NOT NULL,
    selected_option_id bigint NOT NULL,
    is_correct boolean NOT NULL
);


--
-- Name: user_ear_training_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_ear_training_answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_ear_training_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_ear_training_answers_id_seq OWNED BY public.user_ear_training_answers.id;


--
-- Name: user_lesson_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_lesson_progress (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    theory_completed boolean DEFAULT false NOT NULL,
    test_score_percent numeric(5,2),
    test_completed boolean DEFAULT false NOT NULL,
    transcription_score_percent numeric(5,2),
    transcription_completed boolean DEFAULT false NOT NULL,
    progress_percent numeric(5,2) DEFAULT 0.00 NOT NULL,
    status public.progress_status DEFAULT 'locked'::public.progress_status NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_test_completed_score CHECK (((test_completed = false) OR ((test_score_percent IS NOT NULL) AND (test_score_percent >= (80)::numeric)))),
    CONSTRAINT chk_transcription_completed_score CHECK (((transcription_completed = false) OR ((transcription_score_percent IS NOT NULL) AND (transcription_score_percent >= (80)::numeric)))),
    CONSTRAINT user_lesson_progress_progress_percent_check CHECK (((progress_percent >= (0)::numeric) AND (progress_percent <= (100)::numeric))),
    CONSTRAINT user_lesson_progress_test_score_percent_check CHECK (((test_score_percent >= (0)::numeric) AND (test_score_percent <= (100)::numeric))),
    CONSTRAINT user_lesson_progress_transcription_score_percent_check CHECK (((transcription_score_percent >= (0)::numeric) AND (transcription_score_percent <= (100)::numeric)))
);


--
-- Name: user_lesson_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_lesson_progress_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_lesson_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_lesson_progress_id_seq OWNED BY public.user_lesson_progress.id;


--
-- Name: user_lesson_test_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_lesson_test_results (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    score_percent numeric(5,2) NOT NULL,
    passed boolean NOT NULL,
    checked_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_test_result_passed_score CHECK (((passed = false) OR (score_percent >= (80)::numeric))),
    CONSTRAINT user_lesson_test_results_score_percent_check CHECK (((score_percent >= (0)::numeric) AND (score_percent <= (100)::numeric)))
);


--
-- Name: user_lesson_test_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_lesson_test_results_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_lesson_test_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_lesson_test_results_id_seq OWNED BY public.user_lesson_test_results.id;


--
-- Name: user_piano_performance_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_piano_performance_answers (
    id bigint NOT NULL,
    test_result_id bigint NOT NULL,
    piano_performance_block_id bigint NOT NULL,
    performed_json jsonb NOT NULL,
    score_percent numeric(5,2) NOT NULL,
    is_correct boolean NOT NULL,
    CONSTRAINT user_piano_performance_answers_score_percent_check CHECK (((score_percent >= (0)::numeric) AND (score_percent <= (100)::numeric)))
);


--
-- Name: user_piano_performance_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_piano_performance_answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_piano_performance_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_piano_performance_answers_id_seq OWNED BY public.user_piano_performance_answers.id;


--
-- Name: user_quiz_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_quiz_answers (
    id bigint NOT NULL,
    test_result_id bigint NOT NULL,
    question_id bigint NOT NULL,
    selected_option_id bigint NOT NULL,
    is_correct boolean NOT NULL
);


--
-- Name: user_quiz_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_quiz_answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_quiz_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_quiz_answers_id_seq OWNED BY public.user_quiz_answers.id;


--
-- Name: user_topic_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_topic_progress (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    topic_id bigint NOT NULL,
    progress_percent numeric(5,2) DEFAULT 0.00 NOT NULL,
    status public.progress_status DEFAULT 'locked'::public.progress_status NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_topic_progress_progress_percent_check CHECK (((progress_percent >= (0)::numeric) AND (progress_percent <= (100)::numeric)))
);


--
-- Name: user_topic_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_topic_progress_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_topic_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_topic_progress_id_seq OWNED BY public.user_topic_progress.id;


--
-- Name: user_transcription_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_transcription_results (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    transcription_block_id bigint NOT NULL,
    original_file_name character varying(255),
    original_file_path text,
    midi_file_path text,
    recognized_json jsonb NOT NULL,
    score_percent numeric(5,2) NOT NULL,
    passed boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_transcription_result_passed_score CHECK (((passed = false) OR (score_percent >= (80)::numeric))),
    CONSTRAINT user_transcription_results_score_percent_check CHECK (((score_percent >= (0)::numeric) AND (score_percent <= (100)::numeric)))
);


--
-- Name: user_transcription_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_transcription_results_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_transcription_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_transcription_results_id_seq OWNED BY public.user_transcription_results.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(50),
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    google_id character varying(255),
    display_name character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_auth_method CHECK (((password_hash IS NOT NULL) OR (google_id IS NOT NULL)))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: ear_training_options id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ear_training_options ALTER COLUMN id SET DEFAULT nextval('public.ear_training_options_id_seq'::regclass);


--
-- Name: lesson_blocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_blocks ALTER COLUMN id SET DEFAULT nextval('public.lesson_blocks_id_seq'::regclass);


--
-- Name: lessons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);


--
-- Name: quiz_options id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_options ALTER COLUMN id SET DEFAULT nextval('public.quiz_options_id_seq'::regclass);


--
-- Name: quiz_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions ALTER COLUMN id SET DEFAULT nextval('public.quiz_questions_id_seq'::regclass);


--
-- Name: topics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.topics ALTER COLUMN id SET DEFAULT nextval('public.topics_id_seq'::regclass);


--
-- Name: user_ear_training_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_ear_training_answers ALTER COLUMN id SET DEFAULT nextval('public.user_ear_training_answers_id_seq'::regclass);


--
-- Name: user_lesson_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_progress ALTER COLUMN id SET DEFAULT nextval('public.user_lesson_progress_id_seq'::regclass);


--
-- Name: user_lesson_test_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_test_results ALTER COLUMN id SET DEFAULT nextval('public.user_lesson_test_results_id_seq'::regclass);


--
-- Name: user_piano_performance_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_piano_performance_answers ALTER COLUMN id SET DEFAULT nextval('public.user_piano_performance_answers_id_seq'::regclass);


--
-- Name: user_quiz_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quiz_answers ALTER COLUMN id SET DEFAULT nextval('public.user_quiz_answers_id_seq'::regclass);


--
-- Name: user_topic_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_topic_progress ALTER COLUMN id SET DEFAULT nextval('public.user_topic_progress_id_seq'::regclass);


--
-- Name: user_transcription_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_transcription_results ALTER COLUMN id SET DEFAULT nextval('public.user_transcription_results_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: ear_training_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ear_training_blocks (block_id, prompt_text, config_json) FROM stdin;
19	Listen and identify the note you hear.	{"notes": [{"note": "C4", "duration": 1.5}]}
20	Listen and identify the note you hear.	{"notes": [{"note": "G4", "duration": 1.5}]}
21	Listen and identify the note you hear.	{"notes": [{"note": "E4", "duration": 1.5}]}
\.


--
-- Data for Name: ear_training_options; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ear_training_options (id, ear_training_block_id, option_text, is_correct, "position") FROM stdin;
1	19	C	t	1
2	19	D	f	2
3	19	E	f	3
4	19	G	f	4
5	20	C	f	1
6	20	E	f	2
7	20	F	f	3
8	20	G	t	4
13	21	C	f	1
14	21	D	f	2
15	21	E	t	3
16	21	B	f	4
\.


--
-- Data for Name: lesson_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lesson_blocks (id, lesson_id, tab_type, block_type, title, "position", is_required, created_at, updated_at) FROM stdin;
1	1	theory	theory	What is a Note?	1	t	2026-04-18 11:56:33.314506+02	2026-04-18 11:56:33.314506+02
2	1	theory	staff_example	Notes on the Staff	2	t	2026-04-18 11:56:33.314506+02	2026-04-18 11:56:33.314506+02
3	1	theory	piano_example	Notes on the Piano	4	t	2026-04-18 11:56:33.314506+02	2026-04-18 18:36:17.677534+02
4	1	theory	theory	From Staff to Keys	3	t	2026-04-18 18:36:17.677534+02	2026-04-18 18:36:17.677534+02
5	2	theory	theory	Reading Notes on the Staff	1	t	2026-04-18 20:36:33.767815+02	2026-04-18 20:36:33.767815+02
6	2	theory	staff_example	Notes on the Lines	2	t	2026-04-18 20:36:33.767815+02	2026-04-18 20:36:33.767815+02
7	2	theory	piano_example	Locate the Notes	3	t	2026-04-18 20:36:33.767815+02	2026-04-18 20:36:33.767815+02
8	3	theory	theory	Note Values & Time	1	t	2026-04-18 20:36:33.777025+02	2026-04-18 20:36:33.777025+02
9	3	theory	staff_example	Mixed Note Durations	2	t	2026-04-18 20:36:33.777025+02	2026-04-18 20:36:33.777025+02
10	3	theory	piano_example	Play the Beat	3	t	2026-04-18 20:36:33.777025+02	2026-04-18 20:36:33.777025+02
11	4	theory	theory	Dynamics & Tempo	1	t	2026-04-18 20:36:33.778855+02	2026-04-18 20:36:33.778855+02
12	4	theory	staff_example	A Simple Melody	2	t	2026-04-18 20:36:33.778855+02	2026-04-18 20:36:33.778855+02
13	4	theory	piano_example	Keys of the Melody	3	t	2026-04-18 20:36:33.778855+02	2026-04-18 20:36:33.778855+02
15	1	test	quiz	Notes Quiz	1	t	2026-04-22 09:41:38.507132+02	2026-04-22 09:41:38.507132+02
19	1	test	ear_training	Identify the Note	2	t	2026-04-22 14:31:26.027075+02	2026-04-22 14:31:26.027075+02
20	1	test	ear_training	Identify the Note	3	t	2026-04-22 14:31:26.027075+02	2026-04-22 14:31:26.027075+02
21	1	test	ear_training	Identify the Note	4	t	2026-04-22 14:31:26.027075+02	2026-04-22 14:56:55.94836+02
23	1	test	piano_performance	Play on the Keyboard	5	t	2026-04-22 15:36:41.517313+02	2026-04-22 15:36:41.517313+02
24	1	transcription	transcription	Play C major scale	1	t	2026-04-23 18:58:06.838996+02	2026-04-23 18:58:06.838996+02
25	2	transcription	transcription	Play the Treble Clef Line Notes	1	t	2026-04-30 17:30:44.843433+02	2026-04-30 17:30:44.843433+02
26	3	transcription	transcription	Play the Rhythm Pattern	1	t	2026-04-30 18:07:03.000237+02	2026-04-30 18:07:03.000237+02
27	4	transcription	transcription	Play the Melody at Moderato	1	t	2026-04-30 18:07:18.166357+02	2026-04-30 18:07:18.166357+02
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lessons (id, topic_id, title, description, "position", created_at, updated_at) FROM stdin;
1	1	Introduction to Notes	Learn note names and their positions on the staff	1	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
2	1	Reading Sheet Music	Clefs, staff lines, and basic notation	2	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
3	1	Rhythm & Time Signatures	Note values, rests, and time signatures	3	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
4	1	Dynamics & Tempo	Loud, soft, fast, slow — expression in music	4	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
5	2	Major Scales	Structure and fingering of major scales	1	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
6	2	Natural Minor Scale	The natural minor scale and its sound	2	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
7	2	Harmonic & Melodic Minor	Variations of the minor scale	3	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
8	2	Key Signatures	Reading and recognizing key signatures	4	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
9	3	What Are Intervals?	Distance between two notes	1	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
10	3	Perfect Intervals	Unison, fourth, fifth, octave	2	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
11	3	Major & Minor Intervals	Seconds, thirds, sixths, sevenths	3	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
12	4	Introduction to Triads	Building three-note chords	1	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
13	4	Major & Minor Chords	The two most common chord types	2	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
14	4	Seventh Chords	Adding a fourth note to triads	3	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
15	4	Chord Inversions	Rearranging notes within a chord	4	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
16	5	Diatonic Chords	Chords built from a scale	1	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
17	5	Chord Progressions	Common sequences of chords	2	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
18	5	Cadences	How musical phrases resolve	3	2026-04-17 21:37:36.180084+02	2026-04-17 21:37:36.180084+02
\.


--
-- Data for Name: piano_example_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.piano_example_blocks (block_id, content_json, description) FROM stdin;
3	{"label": "The 7 natural notes on the piano (one octave)", "notes": [{"note": "C4", "duration": "q"}, {"note": "D4", "duration": "q"}, {"note": "E4", "duration": "q"}, {"note": "F4", "duration": "q"}, {"note": "G4", "duration": "q"}, {"note": "A4", "duration": "q"}, {"note": "B4", "duration": "q"}]}	Find these notes on the piano keyboard
7	{"label": "Notes on the lines of the treble clef", "notes": [{"note": "E4", "duration": "q"}, {"note": "G4", "duration": "q"}, {"note": "B4", "duration": "q"}, {"note": "D5", "duration": "q"}]}	\N
10	{"label": "C major triad — quarter, quarter, half", "notes": [{"note": "C4", "duration": "q"}, {"note": "E4", "duration": "q"}, {"note": "G4", "duration": "h"}]}	\N
13	{"label": "Ascending C major arpeggio", "notes": [{"note": "C4", "duration": "q"}, {"note": "E4", "duration": "q"}, {"note": "G4", "duration": "q"}, {"note": "C5", "duration": "q"}]}	\N
\.


--
-- Data for Name: piano_performance_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.piano_performance_blocks (block_id, instruction_text, expected_json) FROM stdin;
23	Find and play these notes on the keyboard in the correct order:	{"notes": ["C4", "D4", "E4", "F4", "G4"]}
\.


--
-- Data for Name: quiz_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_blocks (block_id) FROM stdin;
15
\.


--
-- Data for Name: quiz_options; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_options (id, question_id, option_text, is_correct, "position") FROM stdin;
21	6	5	f	1
22	6	7	t	2
23	6	8	f	3
24	6	12	f	4
25	7	A	f	1
26	7	C	t	2
27	7	D	f	3
28	7	G	f	4
29	8	Fa	f	1
30	8	Sol	t	2
31	8	La	f	3
32	8	Si	f	4
33	9	Natural notes	f	1
34	9	Sharps and flats	t	2
35	9	Octave markers	f	3
36	9	Dynamic indicators	f	4
37	10	Lower	f	1
38	10	Higher	t	2
39	10	Softer	f	3
40	10	Longer	f	4
\.


--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_questions (id, quiz_block_id, question_text, explanation, "position") FROM stdin;
6	15	How many natural notes are there in Western music?	There are 7 natural notes: A, B, C, D, E, F, G. Together with sharps and flats they form the 12-note chromatic scale.	1
7	15	Which note is also known as "Do" in solfège?	In fixed-do solfège, "Do" always refers to the note C.	2
8	15	What is the solfège syllable for the note G?	In solfège, the 7 natural notes are: C=Do, D=Re, E=Mi, F=Fa, G=Sol, A=La, B=Si.	3
9	15	What do the black keys on a piano represent?	White keys represent the 7 natural notes (C, D, E, F, G, A, B). Black keys represent sharps and flats — the notes between the natural ones.	4
10	15	On a staff, a higher note position means a _____ pitch.	The staff uses vertical position to represent pitch. Notes placed higher on the staff have a higher pitch; notes placed lower have a lower pitch.	5
\.


--
-- Data for Name: staff_example_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_example_blocks (block_id, content_json, audio_json, description) FROM stdin;
2	{"clef": "treble", "notes": [{"keys": ["c/4"], "label": "C", "duration": "q"}, {"keys": ["d/4"], "label": "D", "duration": "q"}, {"keys": ["e/4"], "label": "E", "duration": "q"}, {"keys": ["f/4"], "label": "F", "duration": "q"}, {"keys": ["g/4"], "label": "G", "duration": "q"}, {"keys": ["a/4"], "label": "A", "duration": "q"}, {"keys": ["b/4"], "label": "B", "duration": "q"}], "timeSignature": "4/4"}	\N	The seven natural notes shown on the treble clef staff
6	{"clef": "treble", "notes": [{"keys": ["e/4"], "duration": "q"}, {"keys": ["g/4"], "duration": "q"}, {"keys": ["b/4"], "duration": "q"}, {"keys": ["d/5"], "duration": "q"}], "timeSignature": "4/4"}	\N	\N
9	{"clef": "treble", "notes": [{"keys": ["c/4"], "duration": "q"}, {"keys": ["e/4"], "duration": "q"}, {"keys": ["g/4"], "duration": "h"}], "timeSignature": "4/4"}	\N	\N
12	{"clef": "treble", "notes": [{"keys": ["c/4"], "duration": "q"}, {"keys": ["e/4"], "duration": "q"}, {"keys": ["g/4"], "duration": "q"}, {"keys": ["c/5"], "duration": "q"}], "timeSignature": "4/4"}	\N	\N
\.


--
-- Data for Name: theory_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.theory_blocks (block_id, content_json) FROM stdin;
1	{"blocks": [{"text": "What is a Note?", "type": "heading"}, {"text": "A note is a symbol used in music to represent a sound with a specific pitch and duration. Every note has a name — in Western music there are 7 natural notes: C, D, E, F, G, A, and B.", "type": "paragraph"}, {"text": "Notes are placed on a staff — a set of 5 horizontal lines. The position of a note on the staff tells you its pitch: higher placement means a higher pitch.", "type": "paragraph"}, {"type": "list", "items": ["C — Do", "D — Re", "E — Mi", "F — Fa", "G — Sol", "A — La", "B — Si"], "label": "The 7 natural notes"}, {"text": "Middle C (C4) is the C closest to the middle of a standard piano keyboard and is a common reference point in music.", "type": "note"}]}
4	{"blocks": [{"text": "From Staff to Keys", "type": "heading"}, {"text": "Every note written on the staff directly corresponds to a key on the piano. The treble clef staff covers the range most commonly played with the right hand, starting from middle C (C4) upward.", "type": "paragraph"}, {"text": "White keys on the piano represent the 7 natural notes — C, D, E, F, G, A, B — repeating across octaves. Black keys represent sharps and flats, which are the notes between the natural ones.", "type": "paragraph"}, {"type": "list", "items": ["Identify the note name and octave from the staff (e.g. E4)", "Find the group of 2 or 3 black keys — C is always to the left of the 2-black-key group", "Count up from C to reach the target note", "The number after the note name tells you which octave — C4 is middle C"], "label": "How to find a note on the piano"}, {"text": "Try pressing the highlighted keys below — they match exactly the notes shown on the staff above.", "type": "note"}]}
5	{"blocks": [{"text": "Reading Notes on the Staff", "type": "heading"}, {"text": "The treble clef staff has 5 lines and 4 spaces. Each line and space represents a specific note. Learning their names lets you read any piece of sheet music.", "type": "paragraph"}, {"type": "list", "items": ["E4 — Every", "G4 — Good", "B4 — Boy", "D5 — Does", "F5 — Fine"], "label": "Lines (bottom to top)"}, {"type": "list", "items": ["F4", "A4", "C5", "E5"], "label": "Spaces (bottom to top)"}, {"text": "Notes can also appear above or below the staff on short lines called ledger lines. Middle C (C4) sits on the first ledger line below the treble clef staff.", "type": "paragraph"}, {"text": "Tip: use the mnemonics \\"Every Good Boy Does Fine\\" for lines and \\"FACE\\" for spaces to memorise note positions quickly.", "type": "note"}]}
8	{"blocks": [{"text": "Note Values and Time Signatures", "type": "heading"}, {"text": "Rhythm is about time — how long each note lasts and when it is played. Every note has a duration represented by its shape.", "type": "paragraph"}, {"type": "list", "items": ["Whole note — 4 beats", "Half note — 2 beats", "Quarter note — 1 beat", "Eighth note — ½ beat"], "label": "Note durations"}, {"text": "A time signature appears at the beginning of a staff as two numbers. The top number tells you how many beats are in each measure; the bottom number tells you which note value equals one beat.", "type": "paragraph"}, {"type": "list", "items": ["4/4 — four quarter-note beats per measure (most common)", "3/4 — three quarter-note beats per measure (waltz)", "2/4 — two quarter-note beats per measure (march)", "6/8 — six eighth-note beats per measure"], "label": "Common time signatures"}, {"text": "4/4 is so common it is often written as a \\"C\\" symbol (common time) on the staff.", "type": "note"}]}
11	{"blocks": [{"text": "Dynamics and Tempo", "type": "heading"}, {"text": "Dynamics describe how loudly or softly music is played. They are written as Italian abbreviations below the staff and are one of the most expressive tools a composer has.", "type": "paragraph"}, {"type": "list", "items": ["pp (pianissimo) — very soft", "p (piano) — soft", "mp (mezzo-piano) — moderately soft", "mf (mezzo-forte) — moderately loud", "f (forte) — loud", "ff (fortissimo) — very loud"], "label": "Dynamic markings (soft → loud)"}, {"text": "Tempo defines the speed of the music, usually measured in BPM (beats per minute). Tempo markings are written in Italian above the staff.", "type": "paragraph"}, {"type": "list", "items": ["Largo — very slow (~50 BPM)", "Andante — walking pace (~76 BPM)", "Moderato — moderate (~100 BPM)", "Allegro — fast (~132 BPM)", "Presto — very fast (~184 BPM)"], "label": "Common tempo markings (slow → fast)"}, {"text": "Dynamics and tempo work together to give a piece its emotional character — a passage marked pp and Largo feels completely different from one marked ff and Presto.", "type": "note"}]}
\.


--
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.topics (id, title, description, "position", created_at, updated_at) FROM stdin;
1	Music Fundamentals	Notes, clefs, rhythm and basic notation	1	2026-04-17 21:10:15.678703+02	2026-04-17 21:10:15.678703+02
2	Scales & Keys	Major and minor scales, key signatures	2	2026-04-17 21:10:15.678703+02	2026-04-17 21:10:15.678703+02
3	Intervals	Types of intervals and ear training	3	2026-04-17 21:10:15.678703+02	2026-04-17 21:10:15.678703+02
4	Chords	Triads, seventh chords and voicings	4	2026-04-17 21:10:15.678703+02	2026-04-17 21:10:15.678703+02
5	Harmony	Chord progressions, cadences and voice leading	5	2026-04-17 21:10:15.678703+02	2026-04-17 21:10:15.678703+02
\.


--
-- Data for Name: transcription_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transcription_blocks (block_id, instruction_text, expected_json) FROM stdin;
24	Record yourself playing the C major scale: C3, D3, E3, F3, G3, A3, B3, C4 on the piano.	{"notes": ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"], "durations": [1, 1, 1, 1, 1, 1, 1, 1], "timeSignature": "4/4"}
25	Record yourself playing the four notes found on the lines of the treble clef staff: E4, G4, B4, D5. Remember the mnemonic "Every Good Boy Does". Play each note as a quarter note at a comfortable tempo.	{"notes": ["E4", "G4", "B4", "D5"], "durations": [1, 1, 1, 1], "timeSignature": "4/4"}
26	Record yourself playing the rhythm pattern: C4 and E4 as quarter notes (short), then G4 as a half note (twice as long). Focus on holding the half note for the correct duration — it should last twice as long as the quarter notes.	{"notes": ["C4", "E4", "G4"], "durations": [1, 1, 2], "timeSignature": "4/4"}
27	Record yourself playing the simple ascending melody: C4, E4, G4, C5. Play at a Moderato tempo (~100 BPM) — each note should last about 0.6 seconds. Focus on even timing and clear tone for each note.	{"notes": ["C4", "E4", "G4", "C5"], "durations": [1, 1, 1, 1], "timeSignature": "4/4"}
\.


--
-- Data for Name: user_ear_training_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_ear_training_answers (id, test_result_id, ear_training_block_id, selected_option_id, is_correct) FROM stdin;
1	1	19	1	t
2	1	20	6	f
3	1	21	14	f
4	1	19	1	t
5	1	20	8	t
6	1	21	15	t
7	1	19	1	t
8	1	20	8	t
9	1	21	15	t
10	1	19	1	t
11	1	20	8	t
12	1	21	15	t
13	1	19	1	t
14	1	20	8	t
15	1	21	15	t
16	1	19	1	t
17	1	20	8	t
18	1	21	15	t
19	1	19	1	t
20	1	20	8	t
21	1	21	15	t
22	1	19	1	t
23	1	20	8	t
24	1	21	15	t
25	1	19	1	t
26	1	20	8	t
27	1	21	15	t
28	1	19	1	t
29	1	20	8	t
30	1	21	15	t
\.


--
-- Data for Name: user_lesson_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_lesson_progress (id, user_id, lesson_id, theory_completed, test_score_percent, test_completed, transcription_score_percent, transcription_completed, progress_percent, status, completed_at, created_at, updated_at) FROM stdin;
2	5	1	t	\N	f	\N	f	33.33	available	\N	2026-04-22 02:51:28.272875+02	2026-04-22 02:51:28.277555+02
1	1	1	t	100.00	t	100.00	t	100.00	available	\N	2026-04-22 02:47:42.104414+02	2026-04-30 20:55:07.429983+02
33	1	4	f	\N	f	100.00	t	33.33	available	\N	2026-04-30 18:12:35.476491+02	2026-04-30 18:23:34.976742+02
\.


--
-- Data for Name: user_lesson_test_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_lesson_test_results (id, user_id, lesson_id, score_percent, passed, checked_at, updated_at) FROM stdin;
1	1	1	100.00	t	2026-04-23 10:11:30.656019+02	2026-04-30 20:55:07.411194+02
\.


--
-- Data for Name: user_piano_performance_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_piano_performance_answers (id, test_result_id, piano_performance_block_id, performed_json, score_percent, is_correct) FROM stdin;
1	1	23	{"notes": ["C4", "D4", "E4", "F4", "G4"]}	100.00	t
2	1	23	{"notes": ["C4", "D4", "E4", "F4", "G4"]}	100.00	t
3	1	23	{"notes": ["C4", "D4", "E4", "F4", "G4"]}	100.00	t
4	1	23	{"notes": ["C4", "D4", "E4", "F4", "G4", "G4", "F4", "E4", "D4", "C4"]}	100.00	t
5	1	23	{"notes": ["C4", "D4", "E4", "F4", "G4"]}	100.00	t
6	1	23	{"notes": ["C4", "D4", "F4", "G4"]}	40.00	f
7	1	23	{"notes": ["C4", "D4", "E4", "F4", "G4"]}	100.00	t
8	1	23	{"notes": ["C4", "D4", "E4", "F4", "G4"]}	100.00	t
9	1	23	{"notes": ["C4", "D4", "E4", "F4", "G4"]}	100.00	t
\.


--
-- Data for Name: user_quiz_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_quiz_answers (id, test_result_id, question_id, selected_option_id, is_correct) FROM stdin;
1	1	6	22	t
2	1	7	26	t
3	1	8	30	t
4	1	9	33	f
5	1	10	38	t
6	1	6	22	t
7	1	7	26	t
8	1	8	30	t
9	1	9	35	f
10	1	10	38	t
11	1	6	22	t
12	1	7	26	t
13	1	8	30	t
14	1	9	33	f
15	1	10	38	t
16	1	6	22	t
17	1	7	26	t
18	1	8	30	t
19	1	9	34	t
20	1	10	38	t
21	1	6	22	t
22	1	7	26	t
23	1	8	30	t
24	1	9	34	t
25	1	10	38	t
26	1	6	22	t
27	1	7	26	t
28	1	8	30	t
29	1	9	34	t
30	1	10	38	t
31	1	6	22	t
32	1	7	26	t
33	1	8	30	t
34	1	9	34	t
35	1	10	38	t
36	1	6	22	t
37	1	7	26	t
38	1	8	30	t
39	1	9	34	t
40	1	10	38	t
41	1	6	22	t
42	1	7	26	t
43	1	8	30	t
44	1	9	34	t
45	1	10	38	t
46	1	6	22	t
47	1	7	28	f
48	1	8	29	f
49	1	9	34	t
50	1	10	38	t
\.


--
-- Data for Name: user_topic_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_topic_progress (id, user_id, topic_id, progress_percent, status, completed_at, created_at, updated_at) FROM stdin;
2	5	1	0.00	available	\N	2026-04-22 02:51:28.283752+02	2026-04-22 02:51:28.283752+02
1	1	1	25.00	available	\N	2026-04-22 02:47:42.124309+02	2026-04-30 20:55:07.433086+02
\.


--
-- Data for Name: user_transcription_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_transcription_results (id, user_id, lesson_id, transcription_block_id, original_file_name, original_file_path, midi_file_path, recognized_json, score_percent, passed, created_at, updated_at) FROM stdin;
71	1	4	27	recording.webm	\N	\N	{"notes": [{"end": 1.19, "note": "C4", "start": 0.59, "duration": 0.6, "velocity": 91}, {"end": 1.84, "note": "E4", "start": 1.2, "duration": 0.64, "velocity": 90}, {"end": 2.61, "note": "G4", "start": 1.85, "duration": 0.77, "velocity": 91}, {"end": 3.24, "note": "C5", "start": 2.63, "duration": 0.61, "velocity": 87}]}	100.00	t	2026-04-30 18:09:40.57251+02	2026-04-30 18:23:34.966145+02
1	1	1	24	recording.webm	\N	\N	{"notes": [{"end": 1.62, "note": "C3", "start": 0.99, "duration": 0.62, "velocity": 89}, {"end": 1.94, "note": "D3", "start": 1.63, "duration": 0.3, "velocity": 90}, {"end": 2.92, "note": "E3", "start": 2.25, "duration": 0.66, "velocity": 89}, {"end": 3.57, "note": "F3", "start": 2.94, "duration": 0.63, "velocity": 85}, {"end": 4.22, "note": "G3", "start": 3.58, "duration": 0.63, "velocity": 88}, {"end": 4.56, "note": "A3", "start": 4.24, "duration": 0.32, "velocity": 89}, {"end": 5.49, "note": "B3", "start": 4.87, "duration": 0.62, "velocity": 88}, {"end": 6.21, "note": "C4", "start": 5.5, "duration": 0.71, "velocity": 89}]}	100.00	t	2026-04-23 19:04:09.381261+02	2026-04-30 20:39:46.184616+02
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password_hash, google_id, display_name, created_at, updated_at) FROM stdin;
1	\N	homka23052005@gmail.com	\N	108716392428204164087	Ann Homka (Хомка)	2026-04-17 20:10:18.77629+02	2026-04-17 20:10:18.77629+02
3	Homks	homkalila@gmail.com	$2b$12$0rYCXyLcGZABF8Llwy6ps.Hyhk9mrpeXVyB9eR6W3LZtiOoS0BLwS	\N	\N	2026-04-17 20:40:07.780199+02	2026-04-17 20:40:40.818354+02
5	hghghg	homka@gmail.com	$2b$12$o9uRlyXoVzWSX6Dh.1FKwOT0p3vl6FUHkO3EMVP/9CO3J4JOylEAW	\N	\N	2026-04-22 02:50:42.894629+02	2026-04-22 02:50:42.894629+02
\.


--
-- Name: ear_training_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ear_training_options_id_seq', 16, true);


--
-- Name: lesson_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lesson_blocks_id_seq', 27, true);


--
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lessons_id_seq', 18, true);


--
-- Name: quiz_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_options_id_seq', 40, true);


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_questions_id_seq', 10, true);


--
-- Name: topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.topics_id_seq', 5, true);


--
-- Name: user_ear_training_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_ear_training_answers_id_seq', 30, true);


--
-- Name: user_lesson_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_lesson_progress_id_seq', 57, true);


--
-- Name: user_lesson_test_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_lesson_test_results_id_seq', 10, true);


--
-- Name: user_piano_performance_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_piano_performance_answers_id_seq', 9, true);


--
-- Name: user_quiz_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_quiz_answers_id_seq', 50, true);


--
-- Name: user_topic_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_topic_progress_id_seq', 54, true);


--
-- Name: user_transcription_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_transcription_results_id_seq', 97, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: ear_training_blocks ear_training_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ear_training_blocks
    ADD CONSTRAINT ear_training_blocks_pkey PRIMARY KEY (block_id);


--
-- Name: ear_training_options ear_training_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ear_training_options
    ADD CONSTRAINT ear_training_options_pkey PRIMARY KEY (id);


--
-- Name: lesson_blocks lesson_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_blocks
    ADD CONSTRAINT lesson_blocks_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: piano_example_blocks piano_example_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.piano_example_blocks
    ADD CONSTRAINT piano_example_blocks_pkey PRIMARY KEY (block_id);


--
-- Name: piano_performance_blocks piano_performance_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.piano_performance_blocks
    ADD CONSTRAINT piano_performance_blocks_pkey PRIMARY KEY (block_id);


--
-- Name: quiz_blocks quiz_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_blocks
    ADD CONSTRAINT quiz_blocks_pkey PRIMARY KEY (block_id);


--
-- Name: quiz_options quiz_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_pkey PRIMARY KEY (id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: staff_example_blocks staff_example_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_example_blocks
    ADD CONSTRAINT staff_example_blocks_pkey PRIMARY KEY (block_id);


--
-- Name: theory_blocks theory_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theory_blocks
    ADD CONSTRAINT theory_blocks_pkey PRIMARY KEY (block_id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: transcription_blocks transcription_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transcription_blocks
    ADD CONSTRAINT transcription_blocks_pkey PRIMARY KEY (block_id);


--
-- Name: ear_training_options uq_ear_training_options_position; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ear_training_options
    ADD CONSTRAINT uq_ear_training_options_position UNIQUE (ear_training_block_id, "position");


--
-- Name: lesson_blocks uq_lesson_blocks_position; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_blocks
    ADD CONSTRAINT uq_lesson_blocks_position UNIQUE (lesson_id, tab_type, "position");


--
-- Name: lessons uq_lessons_topic_position; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT uq_lessons_topic_position UNIQUE (topic_id, "position");


--
-- Name: quiz_options uq_quiz_options_position; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT uq_quiz_options_position UNIQUE (question_id, "position");


--
-- Name: quiz_questions uq_quiz_questions_position; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT uq_quiz_questions_position UNIQUE (quiz_block_id, "position");


--
-- Name: topics uq_topics_position; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT uq_topics_position UNIQUE ("position");


--
-- Name: user_lesson_progress uq_user_lesson_progress; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_progress
    ADD CONSTRAINT uq_user_lesson_progress UNIQUE (user_id, lesson_id);


--
-- Name: user_lesson_test_results uq_user_lesson_test_results; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_test_results
    ADD CONSTRAINT uq_user_lesson_test_results UNIQUE (user_id, lesson_id);


--
-- Name: user_topic_progress uq_user_topic_progress; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_topic_progress
    ADD CONSTRAINT uq_user_topic_progress UNIQUE (user_id, topic_id);


--
-- Name: user_transcription_results uq_user_transcription_results; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_transcription_results
    ADD CONSTRAINT uq_user_transcription_results UNIQUE (user_id, lesson_id, transcription_block_id);


--
-- Name: user_ear_training_answers user_ear_training_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_ear_training_answers
    ADD CONSTRAINT user_ear_training_answers_pkey PRIMARY KEY (id);


--
-- Name: user_lesson_progress user_lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_progress
    ADD CONSTRAINT user_lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: user_lesson_test_results user_lesson_test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_test_results
    ADD CONSTRAINT user_lesson_test_results_pkey PRIMARY KEY (id);


--
-- Name: user_piano_performance_answers user_piano_performance_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_piano_performance_answers
    ADD CONSTRAINT user_piano_performance_answers_pkey PRIMARY KEY (id);


--
-- Name: user_quiz_answers user_quiz_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quiz_answers
    ADD CONSTRAINT user_quiz_answers_pkey PRIMARY KEY (id);


--
-- Name: user_topic_progress user_topic_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_topic_progress
    ADD CONSTRAINT user_topic_progress_pkey PRIMARY KEY (id);


--
-- Name: user_transcription_results user_transcription_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_transcription_results
    ADD CONSTRAINT user_transcription_results_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_ear_training_options_block_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ear_training_options_block_id ON public.ear_training_options USING btree (ear_training_block_id);


--
-- Name: idx_ear_training_options_id_block_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ear_training_options_id_block_id ON public.ear_training_options USING btree (id, ear_training_block_id);


--
-- Name: idx_lesson_blocks_block_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_blocks_block_type ON public.lesson_blocks USING btree (block_type);


--
-- Name: idx_lesson_blocks_lesson_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_blocks_lesson_id ON public.lesson_blocks USING btree (lesson_id);


--
-- Name: idx_lesson_blocks_lesson_tab; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_blocks_lesson_tab ON public.lesson_blocks USING btree (lesson_id, tab_type);


--
-- Name: idx_lesson_blocks_tab_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_blocks_tab_type ON public.lesson_blocks USING btree (tab_type);


--
-- Name: idx_lessons_topic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lessons_topic_id ON public.lessons USING btree (topic_id);


--
-- Name: idx_quiz_options_id_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_options_id_question_id ON public.quiz_options USING btree (id, question_id);


--
-- Name: idx_quiz_options_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_options_question_id ON public.quiz_options USING btree (question_id);


--
-- Name: idx_quiz_questions_block_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_questions_block_id ON public.quiz_questions USING btree (quiz_block_id);


--
-- Name: idx_user_ear_training_answers_test_result_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_ear_training_answers_test_result_id ON public.user_ear_training_answers USING btree (test_result_id);


--
-- Name: idx_user_lesson_progress_lesson_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_lesson_progress_lesson_id ON public.user_lesson_progress USING btree (lesson_id);


--
-- Name: idx_user_lesson_progress_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_lesson_progress_lookup ON public.user_lesson_progress USING btree (user_id, lesson_id);


--
-- Name: idx_user_lesson_progress_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_lesson_progress_user_id ON public.user_lesson_progress USING btree (user_id);


--
-- Name: idx_user_lesson_test_results_lesson_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_lesson_test_results_lesson_id ON public.user_lesson_test_results USING btree (lesson_id);


--
-- Name: idx_user_lesson_test_results_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_lesson_test_results_user_id ON public.user_lesson_test_results USING btree (user_id);


--
-- Name: idx_user_piano_performance_answers_test_result_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_piano_performance_answers_test_result_id ON public.user_piano_performance_answers USING btree (test_result_id);


--
-- Name: idx_user_quiz_answers_test_result_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_quiz_answers_test_result_id ON public.user_quiz_answers USING btree (test_result_id);


--
-- Name: idx_user_topic_progress_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_topic_progress_lookup ON public.user_topic_progress USING btree (user_id, topic_id);


--
-- Name: idx_user_topic_progress_topic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_topic_progress_topic_id ON public.user_topic_progress USING btree (topic_id);


--
-- Name: idx_user_topic_progress_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_topic_progress_user_id ON public.user_topic_progress USING btree (user_id);


--
-- Name: idx_user_transcription_results_block_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_transcription_results_block_id ON public.user_transcription_results USING btree (transcription_block_id);


--
-- Name: idx_user_transcription_results_lesson_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_transcription_results_lesson_id ON public.user_transcription_results USING btree (lesson_id);


--
-- Name: idx_user_transcription_results_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_transcription_results_user_id ON public.user_transcription_results USING btree (user_id);


--
-- Name: uq_one_transcription_block_per_lesson; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_one_transcription_block_per_lesson ON public.lesson_blocks USING btree (lesson_id, block_type) WHERE (block_type = 'transcription'::public.lesson_block_type);


--
-- Name: lesson_blocks trg_lesson_blocks_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lesson_blocks_updated BEFORE UPDATE ON public.lesson_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lessons trg_lessons_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lessons_updated BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: topics trg_topics_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_topics_updated BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_lesson_progress trg_user_lesson_progress_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_user_lesson_progress_updated BEFORE UPDATE ON public.user_lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_lesson_test_results trg_user_lesson_test_results_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_user_lesson_test_results_updated BEFORE UPDATE ON public.user_lesson_test_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_topic_progress trg_user_topic_progress_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_user_topic_progress_updated BEFORE UPDATE ON public.user_topic_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_transcription_results trg_user_transcription_results_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_user_transcription_results_updated BEFORE UPDATE ON public.user_transcription_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users trg_users_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ear_training_blocks ear_training_blocks_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ear_training_blocks
    ADD CONSTRAINT ear_training_blocks_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.lesson_blocks(id) ON DELETE CASCADE;


--
-- Name: ear_training_options ear_training_options_ear_training_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ear_training_options
    ADD CONSTRAINT ear_training_options_ear_training_block_id_fkey FOREIGN KEY (ear_training_block_id) REFERENCES public.ear_training_blocks(block_id) ON DELETE CASCADE;


--
-- Name: lesson_blocks lesson_blocks_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_blocks
    ADD CONSTRAINT lesson_blocks_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- Name: piano_example_blocks piano_example_blocks_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.piano_example_blocks
    ADD CONSTRAINT piano_example_blocks_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.lesson_blocks(id) ON DELETE CASCADE;


--
-- Name: piano_performance_blocks piano_performance_blocks_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.piano_performance_blocks
    ADD CONSTRAINT piano_performance_blocks_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.lesson_blocks(id) ON DELETE CASCADE;


--
-- Name: quiz_blocks quiz_blocks_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_blocks
    ADD CONSTRAINT quiz_blocks_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.lesson_blocks(id) ON DELETE CASCADE;


--
-- Name: quiz_options quiz_options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;


--
-- Name: quiz_questions quiz_questions_quiz_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_quiz_block_id_fkey FOREIGN KEY (quiz_block_id) REFERENCES public.quiz_blocks(block_id) ON DELETE CASCADE;


--
-- Name: staff_example_blocks staff_example_blocks_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_example_blocks
    ADD CONSTRAINT staff_example_blocks_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.lesson_blocks(id) ON DELETE CASCADE;


--
-- Name: theory_blocks theory_blocks_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theory_blocks
    ADD CONSTRAINT theory_blocks_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.lesson_blocks(id) ON DELETE CASCADE;


--
-- Name: transcription_blocks transcription_blocks_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transcription_blocks
    ADD CONSTRAINT transcription_blocks_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.lesson_blocks(id) ON DELETE CASCADE;


--
-- Name: user_ear_training_answers user_ear_training_answers_ear_training_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_ear_training_answers
    ADD CONSTRAINT user_ear_training_answers_ear_training_block_id_fkey FOREIGN KEY (ear_training_block_id) REFERENCES public.ear_training_blocks(block_id) ON DELETE CASCADE;


--
-- Name: user_ear_training_answers user_ear_training_answers_selected_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_ear_training_answers
    ADD CONSTRAINT user_ear_training_answers_selected_option_id_fkey FOREIGN KEY (selected_option_id) REFERENCES public.ear_training_options(id) ON DELETE CASCADE;


--
-- Name: user_ear_training_answers user_ear_training_answers_test_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_ear_training_answers
    ADD CONSTRAINT user_ear_training_answers_test_result_id_fkey FOREIGN KEY (test_result_id) REFERENCES public.user_lesson_test_results(id) ON DELETE CASCADE;


--
-- Name: user_lesson_progress user_lesson_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_progress
    ADD CONSTRAINT user_lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: user_lesson_progress user_lesson_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_progress
    ADD CONSTRAINT user_lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_lesson_test_results user_lesson_test_results_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_test_results
    ADD CONSTRAINT user_lesson_test_results_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: user_lesson_test_results user_lesson_test_results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_lesson_test_results
    ADD CONSTRAINT user_lesson_test_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_piano_performance_answers user_piano_performance_answers_piano_performance_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_piano_performance_answers
    ADD CONSTRAINT user_piano_performance_answers_piano_performance_block_id_fkey FOREIGN KEY (piano_performance_block_id) REFERENCES public.piano_performance_blocks(block_id) ON DELETE CASCADE;


--
-- Name: user_piano_performance_answers user_piano_performance_answers_test_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_piano_performance_answers
    ADD CONSTRAINT user_piano_performance_answers_test_result_id_fkey FOREIGN KEY (test_result_id) REFERENCES public.user_lesson_test_results(id) ON DELETE CASCADE;


--
-- Name: user_quiz_answers user_quiz_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quiz_answers
    ADD CONSTRAINT user_quiz_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;


--
-- Name: user_quiz_answers user_quiz_answers_selected_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quiz_answers
    ADD CONSTRAINT user_quiz_answers_selected_option_id_fkey FOREIGN KEY (selected_option_id) REFERENCES public.quiz_options(id) ON DELETE CASCADE;


--
-- Name: user_quiz_answers user_quiz_answers_test_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quiz_answers
    ADD CONSTRAINT user_quiz_answers_test_result_id_fkey FOREIGN KEY (test_result_id) REFERENCES public.user_lesson_test_results(id) ON DELETE CASCADE;


--
-- Name: user_topic_progress user_topic_progress_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_topic_progress
    ADD CONSTRAINT user_topic_progress_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- Name: user_topic_progress user_topic_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_topic_progress
    ADD CONSTRAINT user_topic_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_transcription_results user_transcription_results_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_transcription_results
    ADD CONSTRAINT user_transcription_results_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: user_transcription_results user_transcription_results_transcription_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_transcription_results
    ADD CONSTRAINT user_transcription_results_transcription_block_id_fkey FOREIGN KEY (transcription_block_id) REFERENCES public.transcription_blocks(block_id) ON DELETE CASCADE;


--
-- Name: user_transcription_results user_transcription_results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_transcription_results
    ADD CONSTRAINT user_transcription_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict vkCOlpOx8h5xe2eCuIesyIB0sSAwbG7bNqeLLLi2quxiVZE7dkQvxgbeVLPnXJH

