// Certificate Bundle Definitions
// Each bundle contains a set of topics that must be 100% completed (all patterns with 3-4-5 streaks)

export const CERTIFICATE_BUNDLES = [
    {
        id: 1,
        name: "Data Foundations",
        icon: "🎓",
        description: "Learn the fundamentals of data and descriptive statistics",
        topics: [
            "Introduction to Data",
            "Descriptive Statistics"
        ]
    },
    {
        id: 2,
        name: "Probability Theory",
        icon: "🎲",
        description: "Build a strong foundation in probability concepts",
        topics: [
            "Probability Basics"
        ]
    },
    {
        id: 3,
        name: "Probability Distributions",
        icon: "📊",
        description: "Understand key probability distributions and their applications",
        topics: [
            "Binomial Distribution",
            "Poisson Distribution",
            "Normal Distribution",
            "Student's t-Distribution",
            "Chi-Square Distribution",
            "F-Distribution"
        ]
    },
    {
        id: 4,
        name: "Sampling & Estimation",
        icon: "📈",
        description: "Learn sampling theory and confidence interval estimation",
        topics: [
            "Sampling Distribution of the Mean (CLT)",
            "Sampling Distribution of the Proportion (CLT)",
            "Confidence Intervals for the Mean",
            "Confidence Intervals for the Proportion"
        ]
    },
    {
        id: 5,
        name: "Hypothesis Testing",
        icon: "🔬",
        description: "Perform statistical hypothesis testing and analysis",
        topics: [
            "Hypothesis Testing for the Mean",
            "Hypothesis Testing for the Proportion",
            "Chi-Square Tests",
            "One-Way ANOVA",
            "Two-Way ANOVA"
        ]
    },
    {
        id: 6,
        name: "Complete Certificate in Statistics",
        icon: "🏆",
        description: "Complete all certificate bundles to earn the Final Certificate",
        topics: [], // Special case: requires all other bundles
        requiresAllBundles: true
    }
];
