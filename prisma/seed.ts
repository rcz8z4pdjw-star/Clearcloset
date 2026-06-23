import { PrismaClient, Role, AgeBandType, ContentStatus, ContentType, NotificationType } from '@prisma/client';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Helper to create date of birth for specific age
function createDOB(age: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - age);
  return date;
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.sessionNote.deleteMany();
  await prisma.mentorshipSession.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.actionPlan.deleteMany();
  await prisma.mentorAssignment.deleteMany();
  await prisma.cohortMembership.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.rSVP.deleteMany();
  await prisma.event.deleteMany();
  await prisma.cohortChallenge.deleteMany();
  await prisma.cohort.deleteMany();
  await prisma.moderationFlag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.tradeApproval.deleteMany();
  await prisma.tradeRequest.deleteMany();
  await prisma.performanceSnapshot.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.constraint.deleteMany();
  await prisma.rubricScore.deleteMany();
  await prisma.marketMemo.deleteMany();
  await prisma.rubric.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.impactNote.deleteMany();
  await prisma.grantProposal.deleteMany();
  await prisma.givingStrategy.deleteMany();
  await prisma.governanceExercise.deleteMany();
  await prisma.seedReview.deleteMany();
  await prisma.seedSubmission.deleteMany();
  await prisma.networkingRequest.deleteMany();
  await prisma.careerPlan.deleteMany();
  await prisma.savingsHabit.deleteMany();
  await prisma.savingsGoal.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.wealthStory.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.answerChoice.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.contentApproval.deleteMany();
  await prisma.contentVersion.deleteMany();
  await prisma.disclosure.deleteMany();
  await prisma.contentItem.deleteMany();
  await prisma.track.deleteMany();
  await prisma.template.deleteMany();
  await prisma.glossaryTerm.deleteMany();
  await prisma.iCMeeting.deleteMany();
  await prisma.exportJob.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.householdMembership.deleteMany();
  await prisma.household.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.ageBand.deleteMany();

  // =====================
  // AGE BANDS
  // =====================
  console.log('Creating age bands...');
  const ageBands = await Promise.all([
    prisma.ageBand.create({
      data: {
        type: 'JUNIOR_FOUNDATIONS',
        name: 'Junior Foundations',
        description: 'Building foundational knowledge about money, family, and responsibility',
        minAge: 10,
        maxAge: 12,
        sortOrder: 1,
      },
    }),
    prisma.ageBand.create({
      data: {
        type: 'TEEN_SKILLS',
        name: 'Teen Skills',
        description: 'Developing practical financial literacy and decision-making skills',
        minAge: 13,
        maxAge: 15,
        sortOrder: 2,
      },
    }),
    prisma.ageBand.create({
      data: {
        type: 'LAUNCH',
        name: 'Launch',
        description: 'Preparing for independence with career and financial planning',
        minAge: 16,
        maxAge: 22,
        sortOrder: 3,
      },
    }),
    prisma.ageBand.create({
      data: {
        type: 'STEWARDSHIP_PRACTICUM',
        name: 'Stewardship Practicum',
        description: 'Hands-on experience with investment and governance',
        minAge: 23,
        maxAge: 30,
        sortOrder: 4,
      },
    }),
    prisma.ageBand.create({
      data: {
        type: 'LEADERSHIP',
        name: 'Leadership',
        description: 'Advanced stewardship and family leadership preparation',
        minAge: 25,
        maxAge: 35,
        sortOrder: 5,
      },
    }),
  ]);

  const ageBandMap = Object.fromEntries(ageBands.map(ab => [ab.type, ab]));

  // =====================
  // HOUSEHOLDS
  // =====================
  console.log('Creating households...');
  const households = await Promise.all([
    prisma.household.create({
      data: {
        name: 'The Wellington Family',
        description: 'Multi-generational family with diversified business interests',
      },
    }),
    prisma.household.create({
      data: {
        name: 'The Chen Family',
        description: 'Technology entrepreneurs transitioning to family office model',
      },
    }),
    prisma.household.create({
      data: {
        name: 'The Morrison Family',
        description: 'Third-generation wealth with strong philanthropic focus',
      },
    }),
  ]);

  // =====================
  // USERS
  // =====================
  console.log('Creating users...');
  const passwordHash = await hash('demo123', 12);

  // Admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ascent.dev',
      firstName: 'Sarah',
      lastName: 'Admin',
      dateOfBirth: createDOB(35),
      emailVerified: true,
      roles: {
        create: [{ role: 'ADMIN' }],
      },
    },
  });

  // Compliance user
  const complianceUser = await prisma.user.create({
    data: {
      email: 'compliance@ascent.dev',
      firstName: 'Robert',
      lastName: 'Compliance',
      dateOfBirth: createDOB(45),
      emailVerified: true,
      roles: {
        create: [{ role: 'COMPLIANCE' }],
      },
    },
  });

  // Program Director
  const programDirector = await prisma.user.create({
    data: {
      email: 'director@ascent.dev',
      firstName: 'Patricia',
      lastName: 'Director',
      dateOfBirth: createDOB(42),
      emailVerified: true,
      roles: {
        create: [{ role: 'PROGRAM_DIRECTOR' }],
      },
    },
  });

  // CIO user
  const cioUser = await prisma.user.create({
    data: {
      email: 'cio@ascent.dev',
      firstName: 'Michael',
      lastName: 'CIO',
      dateOfBirth: createDOB(50),
      emailVerified: true,
      roles: {
        create: [{ role: 'CIO' }],
      },
    },
  });

  // Mentor users
  const mentor1 = await prisma.user.create({
    data: {
      email: 'mentor1@ascent.dev',
      firstName: 'Elizabeth',
      lastName: 'Mentor',
      dateOfBirth: createDOB(38),
      bio: 'Former family office executive with 15 years of experience in wealth education.',
      emailVerified: true,
      roles: {
        create: [{ role: 'MENTOR' }],
      },
    },
  });

  const mentor2 = await prisma.user.create({
    data: {
      email: 'mentor2@ascent.dev',
      firstName: 'James',
      lastName: 'Advisor',
      dateOfBirth: createDOB(45),
      bio: 'Investment professional specializing in next-gen education and portfolio management.',
      emailVerified: true,
      roles: {
        create: [{ role: 'MENTOR' }],
      },
    },
  });

  // Parent users
  const parent1 = await prisma.user.create({
    data: {
      email: 'parent1@ascent.dev',
      firstName: 'William',
      lastName: 'Wellington',
      dateOfBirth: createDOB(52),
      emailVerified: true,
      roles: {
        create: [{ role: 'PARENT' }],
      },
      householdMemberships: {
        create: {
          householdId: households[0].id,
          isPrimary: true,
        },
      },
    },
  });

  const parent2 = await prisma.user.create({
    data: {
      email: 'parent2@ascent.dev',
      firstName: 'Helen',
      lastName: 'Chen',
      dateOfBirth: createDOB(48),
      emailVerified: true,
      roles: {
        create: [{ role: 'PARENT' }],
      },
      householdMemberships: {
        create: {
          householdId: households[1].id,
          isPrimary: true,
        },
      },
    },
  });

  // Member users (various ages)
  const member1 = await prisma.user.create({
    data: {
      email: 'member.junior@ascent.dev',
      firstName: 'Emma',
      lastName: 'Wellington',
      dateOfBirth: createDOB(11),
      emailVerified: true,
      roles: {
        create: [{ role: 'MEMBER' }],
      },
      householdMemberships: {
        create: {
          householdId: households[0].id,
        },
      },
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: 'member.teen@ascent.dev',
      firstName: 'Alex',
      lastName: 'Chen',
      dateOfBirth: createDOB(14),
      emailVerified: true,
      roles: {
        create: [{ role: 'MEMBER' }],
      },
      householdMemberships: {
        create: {
          householdId: households[1].id,
        },
      },
    },
  });

  const member3 = await prisma.user.create({
    data: {
      email: 'member.launch@ascent.dev',
      firstName: 'Sophia',
      lastName: 'Wellington',
      dateOfBirth: createDOB(19),
      emailVerified: true,
      roles: {
        create: [{ role: 'MEMBER' }],
      },
      householdMemberships: {
        create: {
          householdId: households[0].id,
        },
      },
    },
  });

  const member4 = await prisma.user.create({
    data: {
      email: 'member.practicum@ascent.dev',
      firstName: 'Daniel',
      lastName: 'Morrison',
      dateOfBirth: createDOB(26),
      emailVerified: true,
      roles: {
        create: [{ role: 'MEMBER' }],
      },
      householdMemberships: {
        create: {
          householdId: households[2].id,
          isPrimary: true,
        },
      },
    },
  });

  const member5 = await prisma.user.create({
    data: {
      email: 'member.leadership@ascent.dev',
      firstName: 'Victoria',
      lastName: 'Chen',
      dateOfBirth: createDOB(30),
      emailVerified: true,
      roles: {
        create: [{ role: 'MEMBER' }],
      },
      householdMemberships: {
        create: {
          householdId: households[1].id,
        },
      },
    },
  });

  // =====================
  // TRACKS & MODULES
  // =====================
  console.log('Creating tracks and modules...');

  // Foundations Track
  const foundationsTrack = await prisma.track.create({
    data: {
      slug: 'foundations',
      name: 'Wealth Foundations',
      description: 'Understanding the basics of family wealth, stewardship, and responsibility',
      shortDescription: 'Build a strong foundation in wealth concepts',
      isPublished: true,
      sortOrder: 1,
      ageBands: {
        connect: [
          { id: ageBandMap.JUNIOR_FOUNDATIONS.id },
          { id: ageBandMap.TEEN_SKILLS.id },
        ],
      },
    },
  });

  // Investment Track
  const investmentTrack = await prisma.track.create({
    data: {
      slug: 'investment-fundamentals',
      name: 'Investment Fundamentals',
      description: 'From basics to sophisticated strategies - learn how investing works',
      shortDescription: 'Master investment principles',
      isPublished: true,
      sortOrder: 2,
      ageBands: {
        connect: [
          { id: ageBandMap.LAUNCH.id },
          { id: ageBandMap.STEWARDSHIP_PRACTICUM.id },
          { id: ageBandMap.LEADERSHIP.id },
        ],
      },
    },
  });

  // Career Track
  const careerTrack = await prisma.track.create({
    data: {
      slug: 'career-identity',
      name: 'Career & Identity',
      description: 'Navigate your professional path with clarity and purpose',
      shortDescription: 'Define your career journey',
      isPublished: true,
      sortOrder: 3,
      ageBands: {
        connect: [
          { id: ageBandMap.LAUNCH.id },
          { id: ageBandMap.STEWARDSHIP_PRACTICUM.id },
          { id: ageBandMap.LEADERSHIP.id },
        ],
      },
    },
  });

  // IC Practicum Track
  const icPracticumTrack = await prisma.track.create({
    data: {
      slug: 'ic-practicum',
      name: 'IC Practicum',
      description: 'Hands-on investment committee experience and portfolio management',
      shortDescription: 'Practice real investment decisions',
      isPublished: true,
      sortOrder: 4,
      ageBands: {
        connect: [
          { id: ageBandMap.STEWARDSHIP_PRACTICUM.id },
        ],
      },
    },
  });

  // Philanthropy Track
  const philanthropyTrack = await prisma.track.create({
    data: {
      slug: 'philanthropic-leadership',
      name: 'Philanthropic Leadership',
      description: 'Create meaningful impact through strategic giving',
      shortDescription: 'Lead with purpose and impact',
      isPublished: true,
      sortOrder: 5,
      ageBands: {
        connect: [
          { id: ageBandMap.LAUNCH.id },
          { id: ageBandMap.STEWARDSHIP_PRACTICUM.id },
          { id: ageBandMap.LEADERSHIP.id },
        ],
      },
    },
  });

  // Governance Track
  const governanceTrack = await prisma.track.create({
    data: {
      slug: 'family-governance',
      name: 'Family Governance & Stewardship',
      description: 'Learn the principles and practices of family governance',
      shortDescription: 'Master family leadership',
      isPublished: true,
      sortOrder: 6,
      ageBands: {
        connect: [
          { id: ageBandMap.LAUNCH.id },
          { id: ageBandMap.STEWARDSHIP_PRACTICUM.id },
          { id: ageBandMap.LEADERSHIP.id },
        ],
      },
    },
  });

  // Create Modules for Foundations Track
  const foundationsModule1 = await prisma.module.create({
    data: {
      trackId: foundationsTrack.id,
      slug: 'understanding-family-wealth',
      name: "Understanding Your Family's Wealth",
      description: 'A comprehensive guide to understanding where wealth comes from and your role as a steward',
      isPublished: true,
      sortOrder: 1,
      ageBands: {
        connect: [{ id: ageBandMap.JUNIOR_FOUNDATIONS.id }, { id: ageBandMap.TEEN_SKILLS.id }],
      },
    },
  });

  // Create Lessons for Understanding Family Wealth Module
  const lessons = await Promise.all([
    prisma.lesson.create({
      data: {
        moduleId: foundationsModule1.id,
        slug: 'wealth-origin-story',
        title: 'Your Family\'s Wealth Origin Story',
        description: 'Every family has a unique story of how their wealth was created',
        content: `
# Your Family's Wealth Origin Story

Every family has a unique story about how their wealth was created. Understanding this story is the first step to becoming a good steward.

## What is a Wealth Origin Story?

A wealth origin story is the history of how your family built its financial resources. It might include:

- **Entrepreneurship**: Starting and growing businesses
- **Professional Success**: Careers in medicine, law, finance, or other fields
- **Investments**: Smart decisions about money over time
- **Inheritance**: Wealth passed down through generations
- **Innovation**: Creating something new that people needed

## Why Does This Matter?

Understanding your family's wealth origin story helps you:

1. **Appreciate the work** that went into building the family's resources
2. **Learn valuable lessons** from the decisions that were made
3. **Connect with your family's values** and what they believed was important
4. **Prepare for your role** in preserving and growing this legacy

## Reflection Questions

Take some time to think about these questions:

- What do you know about how your family built its wealth?
- What values guided your family's decisions?
- What challenges did your family overcome?
- What lessons can you learn from their experiences?

> "Wealth is not about having a lot of money; it's about having a lot of options." - Chris Rock

## Activity

Ask a family member to share one story about how your family built its wealth. Write down what you learned and what values you noticed in the story.
        `,
        sortOrder: 1,
        isPublished: true,
        duration: 15,
      },
    }),
    prisma.lesson.create({
      data: {
        moduleId: foundationsModule1.id,
        slug: 'stewardship-responsibility',
        title: 'What Does Stewardship Mean?',
        description: 'Understanding your responsibility as a steward of family wealth',
        content: `
# What Does Stewardship Mean?

Stewardship is one of the most important concepts for anyone who will inherit or manage family wealth.

## Definition

**Stewardship** means taking care of something valuable that has been entrusted to you, with the goal of passing it on in even better condition.

Think of yourself as a caretaker, not an owner. The wealth you'll manage isn't just yours—it's part of a larger family legacy.

## The Steward's Mindset

Good stewards think differently about wealth:

| Owner Mindset | Steward Mindset |
|--------------|-----------------|
| "This is mine" | "This is entrusted to me" |
| "I can do whatever I want" | "I have a responsibility" |
| "Short-term thinking" | "Long-term thinking" |
| "Individual benefit" | "Family and community benefit" |

## Key Responsibilities

As a steward, you have several important responsibilities:

1. **Preserve** - Protect the wealth from being lost or wasted
2. **Grow** - Make wise decisions to increase the wealth over time
3. **Prepare** - Learn the skills you'll need to manage it well
4. **Pass On** - Eventually transfer it to the next generation

## The Three Capitals

Stewardship isn't just about money. Good stewards care for three types of capital:

- **Financial Capital**: Money, investments, property
- **Human Capital**: Skills, education, health, relationships
- **Social Capital**: Reputation, community connections, values

## Reflection

- What does being a steward mean to you personally?
- How can you start practicing stewardship now, even before you're managing large amounts?
        `,
        sortOrder: 2,
        isPublished: true,
        duration: 20,
      },
    }),
    prisma.lesson.create({
      data: {
        moduleId: foundationsModule1.id,
        slug: 'governance-primer',
        title: 'Family Governance: How Families Make Decisions',
        description: 'An introduction to how wealthy families organize decision-making',
        content: `
# Family Governance: How Families Make Decisions

When families have significant wealth, they need systems for making good decisions together. This is called family governance.

## Why Governance Matters

Imagine a family trying to decide:
- How much to give to charity
- Whether to sell a family business
- How to divide an inheritance fairly

Without good governance, these decisions can cause conflict and harm family relationships.

## Components of Family Governance

### 1. Family Constitution or Charter

A written document that outlines:
- The family's values and mission
- How decisions will be made
- Rules for family members

### 2. Family Council

A group that meets regularly to:
- Discuss important issues
- Make decisions together
- Plan for the future

### 3. Committees

Smaller groups that focus on specific areas:
- **Investment Committee**: Oversees investments
- **Philanthropy Committee**: Manages charitable giving
- **Education Committee**: Plans learning opportunities

### 4. Family Meetings

Regular gatherings where the whole family:
- Connects and builds relationships
- Learns together
- Celebrates achievements

## Your Role

Even as a young family member, you can:
- Attend family meetings
- Ask questions
- Share your ideas
- Learn about the family's values

## Key Takeaway

Good governance helps families work together harmoniously across generations. It's not about control—it's about coordination and communication.
        `,
        sortOrder: 3,
        isPublished: true,
        duration: 25,
      },
    }),
    prisma.lesson.create({
      data: {
        moduleId: foundationsModule1.id,
        slug: 'risk-diversification',
        title: 'Risk and Diversification Basics',
        description: 'Understanding why we don\'t put all eggs in one basket',
        content: `
# Risk and Diversification Basics

One of the most important concepts in managing wealth is understanding risk and how to manage it through diversification.

## What is Risk?

**Risk** is the possibility that something might not turn out as planned. In investing:

- You might lose money
- You might not make as much as you hoped
- The value of your investments might go up and down

## Types of Risk

Different risks affect wealth in different ways:

| Risk Type | What It Means | Example |
|-----------|--------------|---------|
| Market Risk | The overall market goes down | Stock market crash |
| Concentration Risk | Too much in one investment | All money in one company |
| Inflation Risk | Money loses purchasing power | Prices go up faster than savings grow |
| Liquidity Risk | Can't access money when needed | Money locked in real estate |

## The Power of Diversification

**Diversification** means spreading your investments across different types of assets so that if one goes down, others might go up.

### The Egg Basket Analogy

Imagine you have 12 eggs and 3 baskets:
- If you put all eggs in one basket and drop it, you lose everything
- If you spread eggs across all baskets and drop one, you still have most of your eggs

### Real World Example

Instead of owning stock in just one company, a diversified portfolio might include:
- Stocks from many different companies
- Bonds (loans to companies or governments)
- Real estate
- Cash

## Key Principles

1. **Don't put all your eggs in one basket**
2. **Understand what you're investing in**
3. **Match your investments to your timeline**
4. **Accept that some risk is necessary for growth**

## Activity

Think of three different "baskets" where a family might keep their wealth. What are the advantages and disadvantages of each?
        `,
        sortOrder: 4,
        isPublished: true,
        duration: 20,
      },
    }),
    prisma.lesson.create({
      data: {
        moduleId: foundationsModule1.id,
        slug: 'privacy-security',
        title: 'Privacy and Security Hygiene',
        description: 'Protecting your family\'s privacy and staying safe',
        content: `
# Privacy and Security Hygiene

When your family has significant wealth, privacy and security become especially important. This lesson covers the basics of staying safe.

## Why Privacy Matters

People with wealth can be targets for:
- Scams and fraud attempts
- Social engineering
- Identity theft
- Unwanted attention

## Online Privacy

### Social Media Guidelines

Be thoughtful about what you share:

❌ **Avoid posting:**
- Expensive purchases or trips in real-time
- Your home address or regular locations
- Financial information
- Family conflicts or sensitive issues

✅ **Safe to share:**
- General interests and hobbies
- Achievements (without specific details)
- Photos without location data

### Password Security

Create strong, unique passwords:
- Use at least 12 characters
- Include letters, numbers, and symbols
- Never reuse passwords
- Consider a password manager

### Two-Factor Authentication

Always enable two-factor authentication on:
- Email accounts
- Financial accounts
- Social media accounts

## Recognizing Scams

Common warning signs:
- Urgency ("Act now!")
- Requests for personal information
- Offers that seem too good to be true
- Pressure to keep things secret

### The "Verify" Rule

If anyone contacts you asking for money or information:
1. Don't respond immediately
2. Contact the person/company through a known, official channel
3. Ask a trusted adult before taking action

## Physical Security

Basic principles:
- Don't discuss family finances with strangers
- Be aware of your surroundings
- Know who to contact in emergencies
- Follow your family's security protocols

## Key Takeaway

Privacy and security are about being smart, not paranoid. Simple habits can protect you and your family.
        `,
        sortOrder: 5,
        isPublished: true,
        duration: 15,
      },
    }),
  ]);

  // Create Quiz for Module 1
  const quiz1 = await prisma.quiz.create({
    data: {
      moduleId: foundationsModule1.id,
      title: 'Understanding Family Wealth Quiz',
      description: 'Test your knowledge of wealth foundations concepts',
      passingScore: 70,
      maxAttempts: 3,
      isPublished: true,
      questions: {
        create: [
          {
            text: 'What does "stewardship" mean in the context of family wealth?',
            sortOrder: 1,
            choices: {
              create: [
                { text: 'Owning everything outright', isCorrect: false, sortOrder: 1 },
                { text: 'Taking care of something entrusted to you', isCorrect: true, sortOrder: 2 },
                { text: 'Spending money freely', isCorrect: false, sortOrder: 3 },
                { text: 'Keeping everything secret', isCorrect: false, sortOrder: 4 },
              ],
            },
          },
          {
            text: 'Why is diversification important in managing wealth?',
            sortOrder: 2,
            choices: {
              create: [
                { text: 'It guarantees you will make money', isCorrect: false, sortOrder: 1 },
                { text: 'It spreads risk across different investments', isCorrect: true, sortOrder: 2 },
                { text: 'It makes tracking easier', isCorrect: false, sortOrder: 3 },
                { text: 'It is required by law', isCorrect: false, sortOrder: 4 },
              ],
            },
          },
          {
            text: 'What is a Family Council?',
            sortOrder: 3,
            choices: {
              create: [
                { text: 'A government agency', isCorrect: false, sortOrder: 1 },
                { text: 'A group that meets to discuss family matters and make decisions', isCorrect: true, sortOrder: 2 },
                { text: 'A legal document', isCorrect: false, sortOrder: 3 },
                { text: 'A type of investment', isCorrect: false, sortOrder: 4 },
              ],
            },
          },
          {
            text: 'Which is a warning sign of a potential scam?',
            sortOrder: 4,
            choices: {
              create: [
                { text: 'Taking time to think about a decision', isCorrect: false, sortOrder: 1 },
                { text: 'Urgency and pressure to act immediately', isCorrect: true, sortOrder: 2 },
                { text: 'Asking questions before proceeding', isCorrect: false, sortOrder: 3 },
                { text: 'Verifying information independently', isCorrect: false, sortOrder: 4 },
              ],
            },
          },
          {
            text: 'What are the "Three Capitals" that stewards should care for?',
            sortOrder: 5,
            choices: {
              create: [
                { text: 'Stocks, bonds, and real estate', isCorrect: false, sortOrder: 1 },
                { text: 'Financial, human, and social capital', isCorrect: true, sortOrder: 2 },
                { text: 'Cash, credit, and crypto', isCorrect: false, sortOrder: 3 },
                { text: 'Personal, family, and business capital', isCorrect: false, sortOrder: 4 },
              ],
            },
          },
        ],
      },
    },
  });

  // =====================
  // INVESTMENT MODULES
  // =====================
  const investmentModule1 = await prisma.module.create({
    data: {
      trackId: investmentTrack.id,
      slug: 'asset-classes',
      name: 'Understanding Asset Classes',
      description: 'Learn about the different types of investments and their characteristics',
      isPublished: true,
      sortOrder: 1,
      ageBands: {
        connect: [{ id: ageBandMap.LAUNCH.id }],
      },
    },
  });

  await prisma.lesson.create({
    data: {
      moduleId: investmentModule1.id,
      slug: 'intro-to-asset-classes',
      title: 'Introduction to Asset Classes',
      description: 'An overview of the main types of investments',
      content: `
# Introduction to Asset Classes

Asset classes are categories of investments that share similar characteristics and behave similarly in the market.

## The Main Asset Classes

### 1. Equities (Stocks)
Ownership shares in companies. When you buy stock, you become a part-owner of that company.

**Characteristics:**
- Highest potential returns over long term
- Higher volatility (prices move up and down)
- Dividends possible
- Voting rights in some cases

### 2. Fixed Income (Bonds)
Loans you make to companies or governments. They pay you interest over time.

**Characteristics:**
- More stable than stocks
- Regular income through interest payments
- Return of principal at maturity
- Lower potential returns than stocks

### 3. Cash and Cash Equivalents
Money in bank accounts, money market funds, and short-term government securities.

**Characteristics:**
- Most stable and liquid
- Lowest returns
- Easy to access
- Important for emergencies

### 4. Real Estate
Property investments including residential, commercial, and land.

**Characteristics:**
- Tangible asset you can see and touch
- Potential for rental income
- Less liquid than stocks
- Requires management

### 5. Alternative Investments
Everything else: private equity, hedge funds, commodities, art, collectibles.

**Characteristics:**
- Often less correlated with traditional markets
- May require higher minimums
- Less liquid
- More complex

## Choosing Asset Classes

The right mix depends on:
- Your time horizon
- Your risk tolerance
- Your financial goals
- Your need for income

## Key Takeaway

Understanding asset classes is the foundation of building a diversified portfolio.
      `,
      sortOrder: 1,
      isPublished: true,
      duration: 25,
    },
  });

  // =====================
  // CONTENT ITEMS
  // =====================
  console.log('Creating content items...');

  // Guide: Understanding Your Family's Wealth
  await prisma.contentItem.create({
    data: {
      slug: 'guide-understanding-family-wealth',
      title: "Understanding Your Family's Wealth: A Comprehensive Guide",
      type: 'GUIDE',
      status: 'PUBLISHED',
      summary: 'A comprehensive guide for young family members to understand the origins, responsibilities, and opportunities of family wealth.',
      content: `
# Understanding Your Family's Wealth

## Introduction

This guide is designed to help you understand and appreciate the wealth your family has built, and prepare you for your role as a future steward.

## Table of Contents

1. Your Family's Wealth Origin Story
2. The Stewardship Mindset
3. Family Governance Basics
4. Understanding Risk and Diversification
5. Liquidity and Time Horizons
6. Privacy and Security
7. Introduction to Philanthropy
8. Asking Good Questions
9. Common Challenges
10. Your Journey Forward

---

## Chapter 1: Your Family's Wealth Origin Story

Every fortune has a story. Understanding how your family's wealth was created helps you appreciate the work, decisions, and sometimes luck that led to where you are today...

[Full content continues for each chapter]
      `,
      creatorId: adminUser.id,
      publishedAt: new Date(),
      ageBands: {
        connect: [
          { id: ageBandMap.JUNIOR_FOUNDATIONS.id },
          { id: ageBandMap.TEEN_SKILLS.id },
          { id: ageBandMap.LAUNCH.id },
        ],
      },
      tracks: {
        connect: [{ id: foundationsTrack.id }],
      },
    },
  });

  // Video Series: Investment 101
  await prisma.contentItem.create({
    data: {
      slug: 'video-investment-101',
      title: 'Investment 101: From Basics to Sophisticated Strategies',
      type: 'VIDEO',
      status: 'PUBLISHED',
      summary: 'An 8-module video series covering everything from basic investment concepts to sophisticated strategies.',
      content: `
# Investment 101 Video Series

## Overview

This comprehensive video series will take you from investment basics to sophisticated strategies used by professional investors.

## Modules

### Module 1: Asset Classes (45 min)
Understanding stocks, bonds, real estate, and alternatives

### Module 2: Risk and Return (40 min)
The fundamental relationship between risk and potential reward

### Module 3: Portfolio Construction (50 min)
How to build a diversified portfolio

### Module 4: Alternatives 101 (45 min)
Private equity, hedge funds, and other alternative investments

### Module 5: Behavioral Finance (35 min)
Understanding how psychology affects investment decisions

### Module 6: Manager Selection (40 min)
How to evaluate and select investment managers

### Module 7: Tax Considerations (30 min)
Basic tax concepts for investors (educational only)

### Module 8: How an IC Works (45 min)
Inside a family office investment committee
      `,
      duration: 330, // Total minutes
      creatorId: adminUser.id,
      publishedAt: new Date(),
      ageBands: {
        connect: [
          { id: ageBandMap.LAUNCH.id },
          { id: ageBandMap.STEWARDSHIP_PRACTICUM.id },
        ],
      },
      tracks: {
        connect: [{ id: investmentTrack.id }],
      },
    },
  });

  // Workshop: Psychology of Inherited Wealth
  await prisma.contentItem.create({
    data: {
      slug: 'workshop-psychology-inherited-wealth',
      title: 'The Psychology of Inherited Wealth',
      type: 'WORKSHOP',
      status: 'PUBLISHED',
      summary: 'A 90-minute recorded workshop exploring the emotional and psychological aspects of inheriting wealth.',
      content: `
# The Psychology of Inherited Wealth

## Workshop Overview

This workshop addresses the unique psychological challenges and opportunities that come with inheriting wealth.

## Topics Covered

1. **Identity Formation**
   - Separating your identity from your wealth
   - Building authentic self-esteem
   - Finding your own path

2. **Common Emotional Challenges**
   - Guilt and shame
   - Imposter syndrome
   - Fear of being used
   - Isolation

3. **Healthy Relationships**
   - Navigating friendships
   - Dating and partnerships
   - Family dynamics

4. **Finding Purpose**
   - Creating meaning beyond wealth
   - Contribution and impact
   - Career decisions

5. **Practical Coping Strategies**
   - Setting boundaries
   - Building support systems
   - Therapeutic resources

## Discussion Guide Questions

1. How do you separate your identity from your family's wealth?
2. What boundaries have you found helpful?
3. How do you decide who to trust with information about your background?

## Journaling Prompts

- Describe a time when your family's wealth made a situation complicated
- What aspects of your life give you the most sense of purpose?
- If you had no family wealth, what would you do differently?
      `,
      duration: 90,
      creatorId: adminUser.id,
      publishedAt: new Date(),
      ageBands: {
        connect: [
          { id: ageBandMap.TEEN_SKILLS.id },
          { id: ageBandMap.LAUNCH.id },
          { id: ageBandMap.STEWARDSHIP_PRACTICUM.id },
          { id: ageBandMap.LEADERSHIP.id },
        ],
      },
    },
  });

  // =====================
  // GLOSSARY
  // =====================
  console.log('Creating glossary terms...');

  const glossaryTerms = [
    { term: 'Asset Allocation', definition: 'The process of dividing investments among different asset classes like stocks, bonds, and cash to balance risk and reward.', category: 'Investment' },
    { term: 'Basis Point', definition: 'One hundredth of one percent (0.01%). Used to describe interest rates and investment returns.', category: 'Investment' },
    { term: 'Capital Gains', definition: 'The profit earned when an investment is sold for more than its purchase price.', category: 'Tax' },
    { term: 'Diversification', definition: 'Spreading investments across different assets to reduce risk.', category: 'Investment' },
    { term: 'Dividend', definition: 'A payment made by a company to its shareholders from its profits.', category: 'Investment' },
    { term: 'Equity', definition: 'Ownership interest in a company, typically in the form of stock.', category: 'Investment' },
    { term: 'Fiduciary', definition: 'A person or organization legally obligated to act in another\'s best interest.', category: 'Legal' },
    { term: 'Family Office', definition: 'A private company that manages investments and wealth for an ultra-high-net-worth family.', category: 'Wealth Management' },
    { term: 'Generation-Skipping Trust', definition: 'A trust that passes assets to grandchildren, skipping the children\'s generation.', category: 'Estate Planning' },
    { term: 'Hedge Fund', definition: 'A private investment fund that uses various strategies to generate returns for investors.', category: 'Investment' },
    { term: 'Illiquid', definition: 'An asset that cannot be quickly converted to cash without significant loss of value.', category: 'Investment' },
    { term: 'Index Fund', definition: 'A mutual fund or ETF designed to track the performance of a specific market index.', category: 'Investment' },
    { term: 'Investment Policy Statement (IPS)', definition: 'A document outlining investment objectives, constraints, and guidelines.', category: 'Investment' },
    { term: 'Joint Tenancy', definition: 'A form of property ownership where two or more people hold equal shares with right of survivorship.', category: 'Legal' },
    { term: 'Liquidity', definition: 'How quickly an asset can be converted to cash without affecting its price.', category: 'Investment' },
    { term: 'Market Capitalization', definition: 'The total market value of a company\'s outstanding shares.', category: 'Investment' },
    { term: 'Net Worth', definition: 'Total assets minus total liabilities.', category: 'Finance' },
    { term: 'Operating Agreement', definition: 'A document that governs the operations of an LLC.', category: 'Legal' },
    { term: 'Private Equity', definition: 'Investment in companies not listed on public stock exchanges.', category: 'Investment' },
    { term: 'Qualified Purchaser', definition: 'An individual or entity meeting certain wealth thresholds for private investments.', category: 'Legal' },
    { term: 'Risk Tolerance', definition: 'The degree of variability in investment returns an investor is willing to accept.', category: 'Investment' },
    { term: 'Sharpe Ratio', definition: 'A measure of risk-adjusted return, calculated as excess return divided by standard deviation.', category: 'Investment' },
    { term: 'Trust', definition: 'A legal arrangement where assets are held by one party for the benefit of another.', category: 'Estate Planning' },
    { term: 'Trustee', definition: 'A person or entity responsible for managing a trust.', category: 'Estate Planning' },
    { term: 'Unrealized Gain', definition: 'An increase in the value of an investment that has not yet been sold.', category: 'Investment' },
    { term: 'Volatility', definition: 'A measure of how much an investment\'s price fluctuates over time.', category: 'Investment' },
    { term: 'Wealth Transfer', definition: 'The process of passing assets from one generation to the next.', category: 'Estate Planning' },
    { term: 'Yield', definition: 'The income generated by an investment, expressed as a percentage.', category: 'Investment' },
    { term: 'Alternative Investment', definition: 'Investments outside traditional stocks, bonds, and cash, such as real estate, commodities, or private equity.', category: 'Investment' },
    { term: 'Beneficiary', definition: 'A person or entity designated to receive benefits from a trust, will, or financial account.', category: 'Estate Planning' },
    { term: 'Compound Interest', definition: 'Interest earned on both the initial principal and previously accumulated interest.', category: 'Finance' },
    { term: 'Due Diligence', definition: 'The investigation and evaluation of an investment before making a commitment.', category: 'Investment' },
    { term: 'Endowment', definition: 'A fund established by a donation, typically for nonprofit organizations.', category: 'Philanthropy' },
    { term: 'Family Constitution', definition: 'A written document outlining a family\'s values, governance structure, and policies.', category: 'Governance' },
    { term: 'Grantor', definition: 'The person who creates and funds a trust.', category: 'Estate Planning' },
    { term: 'Human Capital', definition: 'The skills, knowledge, and experience possessed by an individual.', category: 'Wealth Management' },
    { term: 'Impact Investing', definition: 'Investments made with the intention of generating positive social or environmental impact alongside financial returns.', category: 'Investment' },
    { term: 'Legacy Planning', definition: 'The process of creating a plan for how wealth and values will be passed to future generations.', category: 'Estate Planning' },
    { term: 'Mission-Related Investment', definition: 'Investments by foundations that align with their charitable mission.', category: 'Philanthropy' },
    { term: 'Portfolio', definition: 'A collection of investments held by an individual or organization.', category: 'Investment' },
    { term: 'Rebalancing', definition: 'The process of realigning portfolio weightings to maintain desired asset allocation.', category: 'Investment' },
    { term: 'Social Capital', definition: 'The networks, relationships, and reputation that benefit an individual or family.', category: 'Wealth Management' },
    { term: 'Stewardship', definition: 'The responsible management and care of something entrusted to one\'s care.', category: 'Governance' },
    { term: 'Tax-Loss Harvesting', definition: 'Selling investments at a loss to offset capital gains and reduce taxes.', category: 'Tax' },
    { term: 'Values-Based Investing', definition: 'An investment approach that aligns financial decisions with personal or family values.', category: 'Investment' },
    { term: 'Venture Capital', definition: 'Financing provided to early-stage, high-potential startup companies.', category: 'Investment' },
    { term: 'Wire Transfer', definition: 'An electronic transfer of funds between financial institutions.', category: 'Finance' },
    { term: 'ESG', definition: 'Environmental, Social, and Governance factors used to evaluate investments.', category: 'Investment' },
    { term: 'Succession Planning', definition: 'The process of preparing for the transfer of leadership and responsibilities.', category: 'Governance' },
  ];

  await prisma.glossaryTerm.createMany({
    data: glossaryTerms,
  });

  // =====================
  // TEMPLATES
  // =====================
  console.log('Creating templates...');

  await Promise.all([
    prisma.template.create({
      data: {
        slug: 'ips-lite',
        name: 'Investment Policy Statement (IPS) Lite',
        type: 'ips',
        description: 'A simplified investment policy statement template for young investors',
        content: `
# Investment Policy Statement

## Overview
**Investor Name:** ____________________
**Date:** ____________________

## 1. Investment Objectives

### Primary Goal:
[ ] Growth - Maximize long-term appreciation
[ ] Income - Generate regular income
[ ] Balanced - Combination of growth and income
[ ] Preservation - Protect capital

### Time Horizon:
[ ] Short-term (1-3 years)
[ ] Medium-term (3-10 years)
[ ] Long-term (10+ years)

## 2. Risk Tolerance

On a scale of 1-10, my comfort with investment volatility is: ____

## 3. Asset Allocation Guidelines

| Asset Class | Target % | Range |
|------------|----------|-------|
| Equities   |          |       |
| Fixed Income |        |       |
| Cash       |          |       |
| Alternatives |        |       |

## 4. Investment Constraints

- Liquidity needs: ____________________
- Values-based restrictions: ____________________
- Concentration limits: ____________________

## 5. Review Schedule

This IPS will be reviewed: [ ] Annually [ ] Semi-annually [ ] Quarterly

---
Signature: ____________________ Date: ____________________
        `,
        isPublished: true,
      },
    }),
    prisma.template.create({
      data: {
        slug: 'family-meeting-agenda',
        name: 'Family Meeting Agenda Template',
        type: 'meeting_agenda',
        description: 'A structured agenda for productive family meetings',
        content: `
# Family Meeting Agenda

**Date:** ____________________
**Location:** ____________________
**Attendees:** ____________________

---

## 1. Opening (15 minutes)
- Welcome and introductions
- Review meeting objectives
- Approve previous meeting minutes

## 2. Family Updates (30 minutes)
- Individual updates from family members
- Celebrations and acknowledgments
- Upcoming family events

## 3. Financial Review (45 minutes)
- Portfolio performance update
- Investment committee report
- Budget review

## 4. Governance Matters (30 minutes)
- Policy updates
- Committee reports
- Voting items

## 5. Education (30 minutes)
- Learning topic presentation
- Guest speaker (if applicable)
- Discussion

## 6. Philanthropy (20 minutes)
- Giving committee update
- Grant proposals for review
- Impact reports

## 7. Next Generation (20 minutes)
- Youth updates
- Program progress
- Mentorship matching

## 8. Open Discussion (20 minutes)
- Questions and concerns
- Ideas and suggestions
- Family tradition planning

## 9. Closing (10 minutes)
- Action item summary
- Next meeting date
- Closing remarks

---

**Notes:**
____________________
        `,
        isPublished: true,
      },
    }),
    prisma.template.create({
      data: {
        slug: 'market-memo-template',
        name: 'Market Memo Template',
        type: 'market_memo',
        description: 'Template for writing investment research memos',
        content: `
# Market Memo

**Author:** ____________________
**Date:** ____________________
**Topic:** ____________________

---

## Executive Summary
[2-3 sentences summarizing your main thesis and recommendation]

## Current Situation
[Describe the current market environment or situation you're analyzing]

## Analysis

### Key Data Points
- Point 1:
- Point 2:
- Point 3:

### Arguments For
1.
2.
3.

### Arguments Against
1.
2.
3.

### Risk Factors
- Risk 1:
- Risk 2:
- Risk 3:

## Investment Thesis
[State your clear investment thesis in 2-3 sentences]

## Recommendation
[ ] Buy / Increase Position
[ ] Hold / Maintain Position
[ ] Sell / Decrease Position
[ ] No Action

**Rationale:**
[Explain your recommendation]

## Monitoring Criteria
What would cause you to change your view?
1.
2.
3.

---

**Disclaimer:** This memo is for educational purposes only and does not constitute investment advice.
        `,
        isPublished: true,
      },
    }),
  ]);

  // =====================
  // COHORTS
  // =====================
  console.log('Creating cohorts...');

  const cohort1 = await prisma.cohort.create({
    data: {
      slug: 'junior-foundations-2024',
      name: 'Junior Foundations 2024',
      description: 'Cohort for members ages 10-12 beginning their wealth education journey',
      ageBandType: 'JUNIOR_FOUNDATIONS',
      startDate: new Date('2024-01-01'),
      isActive: true,
      memberships: {
        create: [
          { userId: member1.id },
        ],
      },
      challenges: {
        create: [
          {
            title: 'Savings Goal Challenge',
            description: 'Set and track a personal savings goal for 30 days',
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-03-01'),
          },
        ],
      },
    },
  });

  const cohort2 = await prisma.cohort.create({
    data: {
      slug: 'launch-2024',
      name: 'Launch Cohort 2024',
      description: 'Cohort for members ages 16-22 preparing for independence',
      ageBandType: 'LAUNCH',
      startDate: new Date('2024-01-01'),
      isActive: true,
      memberships: {
        create: [
          { userId: member3.id },
        ],
      },
    },
  });

  const cohort3 = await prisma.cohort.create({
    data: {
      slug: 'practicum-2024',
      name: 'Stewardship Practicum 2024',
      description: 'Advanced cohort for IC Practicum participants',
      ageBandType: 'STEWARDSHIP_PRACTICUM',
      startDate: new Date('2024-01-01'),
      isActive: true,
      memberships: {
        create: [
          { userId: member4.id },
        ],
      },
    },
  });

  // =====================
  // MENTOR ASSIGNMENTS
  // =====================
  console.log('Creating mentor assignments...');

  await prisma.mentorAssignment.create({
    data: {
      mentorId: mentor1.id,
      menteeId: member3.id,
      assignedBy: programDirector.id,
      isActive: true,
      notes: 'Sophia is highly motivated and interested in career development',
    },
  });

  await prisma.mentorAssignment.create({
    data: {
      mentorId: mentor2.id,
      menteeId: member4.id,
      assignedBy: programDirector.id,
      isActive: true,
      notes: 'Daniel is participating in the IC Practicum track',
    },
  });

  // =====================
  // PORTFOLIOS (IC Practicum)
  // =====================
  console.log('Creating portfolios...');

  const portfolio1 = await prisma.portfolio.create({
    data: {
      userId: member4.id,
      name: 'IC Practicum Paper Portfolio',
      type: 'paper',
      initialCapital: 100000,
      currentValue: 105230,
      isActive: true,
      constraints: {
        maxSinglePosition: 15,
        maxSectorConcentration: 30,
        minCashReserve: 5,
      },
      holdings: {
        create: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            quantity: 50,
            averageCost: 175.00,
            currentPrice: 185.50,
            assetClass: 'Equity',
            sector: 'Technology',
          },
          {
            symbol: 'MSFT',
            name: 'Microsoft Corporation',
            quantity: 30,
            averageCost: 380.00,
            currentPrice: 395.20,
            assetClass: 'Equity',
            sector: 'Technology',
          },
          {
            symbol: 'JNJ',
            name: 'Johnson & Johnson',
            quantity: 40,
            averageCost: 155.00,
            currentPrice: 162.30,
            assetClass: 'Equity',
            sector: 'Healthcare',
          },
          {
            symbol: 'VTI',
            name: 'Vanguard Total Stock Market ETF',
            quantity: 100,
            averageCost: 225.00,
            currentPrice: 232.50,
            assetClass: 'ETF',
            sector: 'Diversified',
          },
        ],
      },
    },
  });

  // Create a pending trade request
  await prisma.tradeRequest.create({
    data: {
      portfolioId: portfolio1.id,
      userId: member4.id,
      action: 'buy',
      symbol: 'GOOGL',
      quantity: 10,
      price: 140.00,
      thesis: 'Google continues to dominate the search and advertising market. Their AI initiatives with Gemini position them well for future growth. Current valuation appears reasonable given growth prospects.',
      riskAnalysis: 'Regulatory risk around antitrust concerns. Competition in AI from OpenAI/Microsoft. Exposure to advertising market cyclicality.',
      status: 'PENDING',
    },
  });

  // =====================
  // RUBRICS
  // =====================
  console.log('Creating rubrics...');

  await prisma.rubric.create({
    data: {
      name: 'Market Memo Evaluation',
      type: 'market_memo',
      criteria: [
        { name: 'Thesis Clarity', description: 'Is the investment thesis clearly stated and defensible?', maxScore: 25, weight: 1 },
        { name: 'Supporting Analysis', description: 'Quality of data and analysis supporting the thesis', maxScore: 25, weight: 1 },
        { name: 'Risk Assessment', description: 'Identification and analysis of key risks', maxScore: 20, weight: 1 },
        { name: 'Writing Quality', description: 'Clarity, organization, and professionalism of writing', maxScore: 15, weight: 1 },
        { name: 'Actionability', description: 'Clear recommendation with monitoring criteria', maxScore: 15, weight: 1 },
      ],
      isActive: true,
    },
  });

  await prisma.rubric.create({
    data: {
      name: 'Career Plan Evaluation',
      type: 'career_plan',
      criteria: [
        { name: 'Self-Awareness', description: 'Understanding of strengths, weaknesses, and interests', maxScore: 25, weight: 1 },
        { name: 'Goal Clarity', description: 'Clear and achievable short and long-term goals', maxScore: 25, weight: 1 },
        { name: 'Action Plan', description: 'Concrete steps and timeline for achieving goals', maxScore: 25, weight: 1 },
        { name: 'Resource Identification', description: 'Identified resources and support needed', maxScore: 15, weight: 1 },
        { name: 'Flexibility', description: 'Consideration of alternative paths and contingencies', maxScore: 10, weight: 1 },
      ],
      isActive: true,
    },
  });

  // =====================
  // BADGES
  // =====================
  console.log('Creating badges...');

  await Promise.all([
    prisma.badge.create({
      data: {
        slug: 'first-lesson',
        name: 'First Steps',
        description: 'Completed your first lesson',
        criteria: { type: 'lesson_complete', count: 1 },
        sortOrder: 1,
      },
    }),
    prisma.badge.create({
      data: {
        slug: 'quiz-master',
        name: 'Quiz Master',
        description: 'Passed 5 quizzes with a score of 80% or higher',
        criteria: { type: 'quiz_pass', count: 5, minScore: 80 },
        sortOrder: 2,
      },
    }),
    prisma.badge.create({
      data: {
        slug: 'foundations-complete',
        name: 'Foundations Graduate',
        description: 'Completed the Wealth Foundations track',
        criteria: { type: 'track_complete', trackSlug: 'foundations' },
        sortOrder: 3,
      },
    }),
    prisma.badge.create({
      data: {
        slug: 'first-memo',
        name: 'Analyst in Training',
        description: 'Submitted your first market memo',
        criteria: { type: 'memo_submit', count: 1 },
        sortOrder: 4,
      },
    }),
    prisma.badge.create({
      data: {
        slug: 'mentorship-started',
        name: 'Guided Journey',
        description: 'Completed your first mentorship session',
        criteria: { type: 'session_complete', count: 1 },
        sortOrder: 5,
      },
    }),
  ]);

  // =====================
  // EVENTS
  // =====================
  console.log('Creating events...');

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await prisma.event.create({
    data: {
      cohortId: cohort3.id,
      title: 'IC Practicum: Market Review Session',
      description: 'Monthly market review and portfolio discussion with the CIO',
      startTime: new Date(nextMonth.setDate(15)),
      endTime: new Date(nextMonth.setHours(nextMonth.getHours() + 2)),
      location: 'Virtual - Zoom',
      virtualLink: 'https://zoom.us/meeting/example',
    },
  });

  await prisma.event.create({
    data: {
      cohortId: cohort2.id,
      title: 'Career Planning Workshop',
      description: 'Interactive workshop on building your career roadmap',
      startTime: new Date(nextMonth.setDate(20)),
      endTime: new Date(nextMonth.setHours(nextMonth.getHours() + 3)),
      location: 'Conference Room A',
    },
  });

  // =====================
  // NOTIFICATIONS
  // =====================
  console.log('Creating sample notifications...');

  await prisma.notification.createMany({
    data: [
      {
        userId: member4.id,
        type: 'SYSTEM',
        title: 'Welcome to the Platform',
        message: 'Welcome to Ascent Capital Next Gen! Start your journey by exploring the Learning Hub.',
        link: '/dashboard/learning',
      },
      {
        userId: member4.id,
        type: 'REMINDER',
        title: 'New Content Available',
        message: 'A new module on portfolio construction has been added to your track.',
        link: '/dashboard/learning/investment-fundamentals',
      },
    ],
  });

  // =====================
  // AUDIT LOGS
  // =====================
  console.log('Creating initial audit logs...');

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SEED_DATABASE',
      entityType: 'System',
      metadata: {
        seedVersion: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log('');
  console.log('✅ Database seed completed successfully!');
  console.log('');
  console.log('📧 Demo User Accounts:');
  console.log('-------------------------------------------');
  console.log('Admin:       admin@ascent.dev');
  console.log('Compliance:  compliance@ascent.dev');
  console.log('Director:    director@ascent.dev');
  console.log('CIO:         cio@ascent.dev');
  console.log('Mentor 1:    mentor1@ascent.dev');
  console.log('Mentor 2:    mentor2@ascent.dev');
  console.log('Parent 1:    parent1@ascent.dev');
  console.log('Parent 2:    parent2@ascent.dev');
  console.log('Member (11): member.junior@ascent.dev');
  console.log('Member (14): member.teen@ascent.dev');
  console.log('Member (19): member.launch@ascent.dev');
  console.log('Member (26): member.practicum@ascent.dev');
  console.log('Member (30): member.leadership@ascent.dev');
  console.log('-------------------------------------------');
  console.log('');
  console.log('With dev auth enabled, use any of these emails to log in.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
