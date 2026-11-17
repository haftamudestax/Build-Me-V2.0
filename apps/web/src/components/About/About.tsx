import { Box, Button, Stack, Typography } from "@mui/material";

import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Eye,
  Layout,
  Lightbulb,
  Rocket,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Link as RouterLink } from "react-router-dom";

import { openWorkWithMe } from "../WorkWithMe/openWorkWithMe";

interface ValueItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Milestone {
  year: string;
  title: string;
  description: string;
}

const values: ValueItem[] = [
  {
    icon: Users,
    title: "User-Centered Approach",
    description:
      "I put users at the heart of every decision, creating intuitive and meaningful experiences.",
  },
  {
    icon: Code2,
    title: "Code Quality & Security",
    description:
      "I prioritize clean, secure, and maintainable code through engineering best practices and testing.",
  },
  {
    icon: Rocket,
    title: "Performance & Efficiency",
    description:
      "I build optimized, high-performance solutions with a focus on reliability and efficiency.",
  },
  {
    icon: Eye,
    title: "Attention to Detail",
    description:
      "I value thoughtful design, consistency, accessibility, and responsive user experiences.",
  },
  {
    icon: Layout,
    title: "Modern Technology",
    description:
      "I use modern technologies and sound architecture to build scalable web applications.",
  },
  {
    icon: Lightbulb,
    title: "Problem Solving",
    description:
      "I approach complex challenges with curiosity, creativity, and practical engineering solutions.",
  },
];

const milestones: Milestone[] = [
  {
    year: "2012",
    title: "Bachelor's Degree — Electrical Engineering",
    description:
      "Graduated from Mekele Institute of Technology (MIT) with a BSc in Electrical and Electronics Engineering, honored with a full scholarship for academic excellence.",
  },
  {
    year: "2013",
    title: "Master's Program — Railway Systems",
    description:
      "Joined Addis Ababa Institute of Technology (AAiT) to pursue an MSc in Electrical Engineering for Railway Systems, selected as one of 30 scholars by Ethiopian Railway Corporation.",
  },
  {
    year: "2015",
    title: "Master's Degree & Engineering Career",
    description:
      "Graduated with an MSc in Electrical Engineering while working as an Electrical Engineer at Ethiopian Electric Power.",
  },
  {
    year: "2022",
    title: "Full-Stack Development — Microverse",
    description:
      "Embarked on intensive remote learning at Microverse, mastering Ruby on Rails, JavaScript, and full-stack development while collaborating with international peers.",
  },
  {
    year: "2023",
    title: "Microverse Alumni & Global Network",
    description:
      "Successfully graduated from Microverse, joining a global community of 1,000+ developers and gaining access to continued learning opportunities.",
  },
  {
    year: "2024",
    title: "Advanced Full-Stack — freeCodeCamp",
    description:
      "Expanded my expertise with Node.js, Express, Python, and FastAPI through freeCodeCamp's comprehensive curriculum.",
  },
  {
    year: "2026",
    title: "Resident Engineer — EEP",
    description:
      "Promoted to Resident Engineer at Ethiopian Electric Power, leading critical infrastructure projects and technical teams.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <Stack spacing={1.5} className="mb-10">
      {eyebrow && (
        <Typography
          variant="overline"
          className="font-bold tracking-[0.2em] text-blue-800"
        >
          {eyebrow}
        </Typography>
      )}

      <Typography
        component="h2"
        variant="h3"
        className="font-bold tracking-tight text-slate-900"
        sx={{
          fontSize: {
            xs: "1.875rem",
            md: "2.5rem",
          },
        }}
      >
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body1"
          className="max-w-2xl leading-relaxed text-slate-600"
        >
          {description}
        </Typography>
      )}
    </Stack>
  );
}

function About() {
  return (
    <Box
      component="main"
      className="min-h-screen text-slate-900"
      sx={{ backgroundColor: "#F7F6F2" }}
    >
      <Box
        className="border-b border-stone-200"
        sx={{ backgroundColor: "#FAF9F6" }}
      >
        <Box className="mx-auto flex max-w-7xl items-center px-5 py-6 sm:px-8 lg:px-10">
          <Button
            component={RouterLink}
            to="/"
            startIcon={<ArrowLeft size={18} />}
            variant="text"
            className="normal-case text-dark-yellow! hover:text-light-yellow! font-bold!"
          >
            Back to Home
          </Button>

          <Box className="ml-auto">
            <Typography
              variant="overline"
              className="font-bold tracking-widest text-black! bg-white p-2 border-2 border-dark-yellow rounded-4xl"
            >
              TECHNOLOGY OWNERSHIP
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box
        component="section"
        className="border-b border-stone-200 px-5 py-20 sm:px-8 md:py-28"
        sx={{ backgroundColor: "#FAF8F5" }}
      >
        <Stack
          spacing={3}
          className="mx-auto max-w-4xl items-center text-center"
        >
          <Typography
            variant="overline"
            className="rounded-full border border-black bg-light-yellow px-4 py-2 font-bold tracking-[0.2em] text-black"
          >
            ABOUT ME
          </Typography>

          <Typography
            component="h1"
            variant="h2"
            className="font-bold tracking-tight text-dark-yellow fon"
            sx={{
              fontSize: {
                xs: "2.5rem",
                sm: "3.5rem",
                md: "4.5rem",
              },
            }}
          >
            Turning Ideas into Impact
          </Typography>

          <Typography
            variant="h6"
            className="max-w-3xl leading-relaxed text-light-yellow font-extrabold"
            sx={{
              fontSize: {
                xs: "1rem",
                md: "1.25rem",
              },
            }}
          >
            I am a Full-Stack Developer and Electrical Engineer dedicated to
            building beautiful, performant, and user-centered digital
            experiences while applying engineering principles to solve
            real-world problems.
          </Typography>
        </Stack>
      </Box>

      <Box
        component="section"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10"
      >
        <Box className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Stack spacing={3}>
            <Box
              sx={{
                "& .MuiTypography-overline, & span[class*='overline']": {
                  display: "inline-block",
                  bgcolor: "var(--color-dark-yellow)",
                  color: "var(--color-black)",
                  fontWeight: 700,
                  border: "2px solid var(--color-black)",
                  borderRadius: "9999px",
                  px: 1.5,
                  py: 0.5,
                  width: "220px",
                  textAlign: "center",
                },
              }}
            >
              <SectionHeading
                eyebrow="Who is Haftamu Desta"
                title="My Story"
                description="A journey shaped by engineering, continuous learning, and a passion for building meaningful digital solutions."
              />
            </Box>

            <Stack spacing={2.5}>
              <Typography variant="body1" className="leading-8 text-slate-600">
                My story began at{" "}
                <strong className="font-semibold text-slate-900">
                  Mekele Institute of Technology
                </strong>{" "}
                in 2012, where I earned my BSc in Electrical and Electronics
                Engineering. Being among the region's top scorers, I was honored
                with a full scholarship that helped establish the foundation of
                my engineering career.
              </Typography>

              <Typography variant="body1" className="leading-8 text-slate-600">
                In 2015, I pursued my passion for specialized systems at{" "}
                <strong className="font-semibold text-slate-900">
                  Addis Ababa Institute of Technology
                </strong>
                , earning an MSc in Electrical Engineering for Railway Systems.
                Selected as one of 30 scholars by the Ethiopian Railway
                Corporation, I deepened my expertise in complex engineering
                applications.
              </Typography>

              <Typography variant="body1" className="leading-8 text-slate-600">
                While working as an Electrical Engineer at{" "}
                <strong className="font-semibold text-slate-900">
                  Ethiopian Electric Power
                </strong>
                , I discovered my passion for software development. In 2022, I
                joined{" "}
                <strong className="font-semibold text-slate-900">
                  Microverse
                </strong>{" "}
                to study full-stack web development, mastering Ruby on Rails and
                modern web technologies.
              </Typography>

              <Typography variant="body1" className="leading-8 text-slate-600">
                Today, I continue expanding my technical capabilities through{" "}
                <strong className="font-semibold text-slate-900">
                  freeCodeCamp
                </strong>
                , exploring Node.js and Python while continuing my role as
                Resident Engineer. My work brings together hardware engineering
                principles and modern software development.
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              className="pt-3"
            >
              <Button
                component={RouterLink}
                to="/#main-works"
                variant="contained"
                endIcon={<ArrowRight size={18} />}
                className="bg-light-yellow! px-6 py-3 font-bold normal-case shadow-sm hover:bg-dark-yellow! border-2! border-black! rounded-xl!"
              >
                View My Work
              </Button>

              <Button
                type="button"
                variant="outlined"
                onClick={() => openWorkWithMe("coffee")}
                className="bg-dark-yellow! px-6 py-3 font-bold normal-case shadow-sm hover:bg-light-yellow! border-2! border-black! rounded-lg! text-black!"
              >
                Get in Touch
              </Button>
            </Stack>
          </Stack>

          <Box
            className="absolute bottom-0 right-0 h-full w-full rounded-3xl border-2 pointer-events-none"
            sx={{ borderColor: "#D8D3CA" }}
          />
          <Box
            className="relative z-10 -translate-x-3 -translate-y-3 overflow-hidden rounded-3xl shadow-xl"
            sx={{
              backgroundColor: "#EAE8E3",
            }}
          >
            <Box
              component="img"
              src="/images/haftamu_d.jpg"
              alt="Portrait of an electrical engineer and full-stack developer"
              className="aspect-square w-full object-cover"
            />

            <Box className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent px-6 pb-7 pt-20">
              <Typography variant="h6" className="font-bold text-white">
                Electrical Engineer
              </Typography>

              <Typography
                variant="body1"
                className="font-medium text-stone-200"
              >
                Full-Stack Developer
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        className="border-y border-stone-200 px-5 py-20 sm:px-8 lg:px-10"
        sx={{ backgroundColor: "#F1F0EC" }}
      >
        <Box className="mx-auto max-w-7xl">
          <Box
            className="mx-auto max-w-2xl text-center"
            sx={{
              "& .MuiTypography-overline, & span[class*='overline']": {
                display: "inline-block",
                color: "var(--color-light-yellow)",
                fontWeight: 700,
                px: 2,
                py: 0.5,
                mb: 1.5,
              },
              "& h2, & h3, & .MuiTypography-h2, & .MuiTypography-h3, & .MuiTypography-h4":
                {
                  color: "var(--color-dark-yellow) !important",
                  fontWeight: 800,
                },
            }}
          >
            <SectionHeading
              eyebrow="WHAT GUIDES MY WORK"
              title="Principles That Drive Me"
              description="The principles that shape my decisions, influence my engineering approach, and define the experiences I build."
            />
          </Box>

          <Box className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <Box
                  component="article"
                  key={value.title}
                  className="group relative overflow-hidden rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  sx={{
                    backgroundColor: "#FAF8F5",
                    border: "1px solid #E4E0D9",
                    boxShadow: "0 4px 16px rgba(45, 42, 36, 0.035)",
                    "&:hover": {
                      borderColor: "#C9C2B7",
                      backgroundColor: "#FFFFFF",
                    },
                  }}
                >
                  <Box
                    className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl text-dark-yellow transition-colors duration-300"
                    sx={{
                      backgroundColor: "#EAE8E2",
                      "&:hover": {
                        backgroundColor: "#E2DFD7",
                      },
                    }}
                  >
                    <Icon size={28} strokeWidth={1.8} />
                  </Box>

                  <Typography
                    component="h3"
                    variant="h6"
                    className="mb-3 font-bold text-slate-900 transition-colors group-hover:text-light-yellow"
                  >
                    {value.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    className="leading-7 text-slate-600"
                  >
                    {value.description}
                  </Typography>

                  <Box
                    className="absolute bottom-0 left-0 h-6 w-0 transition-all duration-500 group-hover:w-full"
                    sx={{ backgroundColor: "var(--color-dark-yellow)" }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Professional Journey */}
      <Box
        component="section"
        className="border-y border-stone-200 px-5 py-20 sm:px-8 lg:px-10"
        sx={{ backgroundColor: "#F1F0EC" }}
      >
        <Box className="mx-auto max-w-7xl">
          {/* Timeline Heading */}
          <Box className="mx-auto max-w-2xl text-center">
            <Stack spacing={1.5} className="mb-14 items-center">
              <Typography
                variant="overline"
                className="font-bold tracking-[0.2em] text-black"
              >
                MILESTONES and GROWTH
              </Typography>

              <Typography
                component="h2"
                variant="h3"
                className="font-bold tracking-tight text-dark-yellow"
                sx={{
                  fontSize: {
                    xs: "2rem",
                    md: "2.75rem",
                  },
                }}
              >
                My Journey
              </Typography>

              <Typography
                variant="body1"
                className="max-w-2xl leading-relaxed text-slate-600"
              >
                Key milestones in my academic, professional, and software
                engineering journey.
              </Typography>
            </Stack>
          </Box>

          {/* Alternating Timeline */}
          <Box className="relative">
            <Box
              sx={{
                position: "absolute",
                top: 2,
                bottom: 2,
                left: { xs: "19px", md: "50%" },
                width: "2px",
                transform: { xs: "none", md: "translateX(-50%)" },
                borderRadius: 10,
                backgroundColor: "var(--color-dark-yellow)",
              }}
            />

            <Stack spacing={{ xs: 4, md: 6 }}>
              {milestones.map((milestone, index) => {
                const isLeft = index % 2 === 0;

                return (
                  <Box
                    key={`${milestone.year}-${milestone.title}`}
                    sx={{
                      position: "relative",
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "40px minmax(0, 1fr)",
                        md: "minmax(0, 1fr) 64px minmax(0, 1fr)",
                      },
                      alignItems: "center",
                    }}
                  >
                    {/* Milestone Card */}
                    <Box
                      component="article"
                      sx={{
                        gridColumn: {
                          xs: "2",
                          md: isLeft ? "1" : "3",
                        },
                        gridRow: 1,
                        minWidth: 0,
                        p: { xs: 2.5, sm: 3.5 },
                        borderRadius: { xs: 3, md: 4 },
                        border: "1px solid",
                        borderColor: isLeft ? "#E3DED5" : "#DDD9D0",
                        backgroundColor: isLeft
                          ? "var(--color-dark-yellow)"
                          : "var(--color-light-yellow)",
                        boxShadow: "0 8px 22px rgba(45, 42, 36, 0.055)",
                        transition: "transform 0.3s ease, box-shadow 0.3s ease",
                        "&:hover": {
                          transform: {
                            xs: "translateY(-3px)",
                            md: isLeft ? "translateX(-5px)" : "translateX(5px)",
                          },
                          boxShadow: "0 14px 28px rgba(45, 42, 36, 0.10)",
                        },
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{
                          display: "block",
                          mb: 1,
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          letterSpacing: "0.14em",
                          color: "#315B82",
                        }}
                      >
                        {milestone.year}
                      </Typography>

                      <Typography
                        component="h3"
                        sx={{
                          mb: 1,
                          fontSize: {
                            xs: "1.05rem",
                            sm: "1.2rem",
                            md: "1.35rem",
                          },
                          fontWeight: 750,
                          lineHeight: 1.4,
                          color: "#202B38",
                        }}
                      >
                        {milestone.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "0.9rem", md: "0.98rem" },
                          lineHeight: 1.75,
                          color: "var(--color-whit)",
                          fontWeight: 700,
                        }}
                      >
                        {milestone.description}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        gridColumn: { xs: "1", md: "2" },
                        gridRow: 1,
                        justifySelf: "center",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: { xs: 20, md: 22 },
                        height: { xs: 20, md: 22 },
                        borderRadius: "50%",
                        border: "4px solid #F1F0EC",
                        backgroundColor: "#315B82",
                        boxShadow: "0 0 0 2px #C5BFB4",
                      }}
                    >
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          backgroundColor: "#FAF8F5",
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Box>
      </Box>
      <Box
        component="section"
        className="border-t border-stone-200 px-5 py-20 sm:px-8 md:py-24"
        sx={{ backgroundColor: "#FAF8F5" }}
      >
        <Stack
          spacing={3}
          className="mx-auto max-w-3xl items-center text-center"
        >
          <Typography
            component="h2"
            variant="h3"
            className="font-bold tracking-tight text-dark-yellow text-2xl"
            sx={{
              fontSize: {
                xs: "2rem",
                md: "2.75rem",
              },
            }}
          >
            Ready to Create Something Great?
          </Typography>

          <Typography
            variant="h6"
            className="font-normal leading-relaxed text-slate-600"
            sx={{
              fontSize: {
                xs: "1rem",
                md: "1.2rem",
              },
            }}
          >
            Let's turn your vision into reality. I'm currently available for
            freelance projects, collaborations, contract work, and full-time
            employment opportunities.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            className="pt-3"
          >
            <Button
              type="button"
              variant="contained"
              endIcon={<ArrowRight size={18} />}
              onClick={() => openWorkWithMe("delivery")}
              sx={{
                borderRadius: 0,
                border: "1.5px solid var(--color-black)",
                backgroundColor: "var(--color-black)",
                color: "#ffffff",
                px: 3.5,
                py: 1.5,
                fontWeight: 700,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "var(--color-light-yellow)",
                  color: "var(--color-black)",
                  border: "1.5px solid var(--color-black)",
                  boxShadow: "none",
                },
              }}
            >
              Work With Me
            </Button>

            <Button
              component="a"
              href="/pdf/Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              sx={{
                borderRadius: 0,
                border: "1.5px solid var(--color-black)",
                backgroundColor: "var(--color-dark-yellow)",
                color: "var(--color-black)",
                px: 3.5,
                py: 1.5,
                fontWeight: 700,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "var(--color-black)",
                  color: "#ffffff",
                  border: "1.5px solid var(--color-black)",
                  boxShadow: "none",
                },
              }}
            >
              View Resume
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

export default About;
