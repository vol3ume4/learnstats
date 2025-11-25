const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Topic-level approaches
const TOPIC_APPROACH_ONEWAY = `Use the 6-step hypothesis testing framework. Use 'from scipy import stats' and 'stats.f' for F-distribution calculations. For ANOVA test statistic, calculate manually using formulas or use 'stats.f_oneway()'.`;

const TOPIC_APPROACH_TWOWAY = `Use the 6-step hypothesis testing framework. Two-way ANOVA tests two factors simultaneously and their interaction. Use 'from scipy import stats' and 'stats.f' for calculations.`;

const PATTERNS_F_DIST = [
    {
        pattern: "Understanding the F-Distribution",
        approach: "Decode: F-distribution is the ratio of two chi-square distributions: F = (χ²₁/df₁)/(χ²₂/df₂). Used for comparing variances. Key Properties: (1) Always positive (ratio of squared values), (2) Right-skewed, (3) Requires two df parameters (numerator df₁ and denominator df₂), (4) Mean ≈ df₂/(df₂-2) when df₂ > 2. As df increases, approaches Normal."
    },
    {
        pattern: "F-Distribution Calculations (CDF, PPF)",
        approach: "Decode: Requires two df parameters. Use 'from scipy import stats' then 'stats.f.cdf(x, dfn, dfd)' where dfn = numerator df, dfd = denominator df. For critical values: 'stats.f.ppf(p, dfn, dfd)'. Always right-tailed test in ANOVA context."
    },
    {
        pattern: "Finding Critical F-Values",
        approach: "Decode: Given significance level (alpha), df₁ (between groups), df₂ (within groups). Use 'stats.f.ppf(1 - alpha, df1, df2)' for right-tail critical value. ANOVA uses right-tailed test because we're testing if variance between groups is significantly larger than variance within groups."
    }
];

const PATTERNS_ONEWAY = [
    {
        pattern: "Understanding One-Way ANOVA (Concepts)",
        approach: "Decode: ANOVA = Analysis of Variance. Compares means of 3+ groups simultaneously. Why not multiple t-tests? Multiple comparisons inflate Type I error (family-wise error rate). H₀: μ₁ = μ₂ = μ₃ = ... (all group means equal). H₁: At least one mean is different. Formula: F = (Variance Between Groups)/(Variance Within Groups) = MSB/MSW. Assumptions: (1) Independence, (2) Normality in each group, (3) Homogeneity of variance (equal variances across groups)."
    },
    {
        pattern: "One-Way ANOVA Calculations",
        approach: "Apply 6-step framework. Step 2: Use F-test. Calculate df₁ = k-1 (k = number of groups), df₂ = N-k (N = total observations). Step 3: Calculate SSB (Sum of Squares Between), SSW (Sum of Squares Within), MSB = SSB/df₁, MSW = SSW/df₂, F = MSB/MSW. Or use 'stats.f_oneway(group1, group2, group3, ...)'. Step 4: p-value = 'stats.f.sf(F_stat, df1, df2)' (right-tail). Check assumptions first (Levene's test for equal variance)."
    },
    {
        pattern: "Post-Hoc Tests (After Rejecting H₀)",
        approach: "Decode: If ANOVA rejects H₀, we know at least one mean differs, but not which ones. Post-hoc tests identify specific differences. Common methods: (1) Tukey HSD - controls family-wise error, pairwise comparisons. (2) Bonferroni - conservative, adjusts alpha for multiple tests. (3) Scheffé - most conservative. Use scipy.stats or manual calculations. Report which pairs are significantly different."
    },
    {
        pattern: "Interpreting One-Way ANOVA Results",
        approach: "Emphasize Step 6. If reject H₀: State that group means are not all equal, then report post-hoc results to specify which groups differ. If fail to reject: State insufficient evidence that means differ. Common mistakes: (1) Claiming all means are equal when fail to reject, (2) Not checking assumptions, (3) Not doing post-hoc when H₀ rejected."
    }
];

const PATTERNS_TWOWAY = [
    {
        pattern: "Understanding Two-Way ANOVA (Concepts)",
        approach: "Decode: Tests two independent variables (factors) and their interaction effect on a dependent variable. Three null hypotheses: (1) H₀ₐ: No main effect of Factor A, (2) H₀ᵦ: No main effect of Factor B, (3) H₀ₐᵦ: No interaction effect. Interaction: Does effect of Factor A depend on level of Factor B? Example: Does effect of teaching method depend on class size? Assumptions: Same as one-way (independence, normality, homogeneity)."
    },
    {
        pattern: "Two-Way ANOVA Calculations",
        approach: "Apply 6-step framework (three times - one for each hypothesis). Calculate: SSA (Factor A), SSB (Factor B), SSAB (Interaction), SSW (Within/Error). df_A = a-1, df_B = b-1, df_AB = (a-1)(b-1), df_W = N-ab. F_A = MSA/MSW, F_B = MSB/MSW, F_AB = MSAB/MSW. Test each F-statistic separately. Interpret interaction first - if significant, main effects may be misleading."
    },
    {
        pattern: "Interpreting Interaction Effects",
        approach: "Decode: Interaction is significant when lines on interaction plot are NOT parallel. If interaction significant: Main effects must be interpreted cautiously - effect of one factor depends on the other. Report simple effects (effect of Factor A at each level of Factor B). If no interaction: Can interpret main effects independently."
    },
    {
        pattern: "Post-Hoc Tests for Two-Way ANOVA",
        approach: "Decode: If main effect significant (and no interaction), do post-hoc on that factor's levels. If interaction significant, do simple effects analysis - compare levels of one factor at each level of the other factor. Use same post-hoc methods as one-way (Tukey, Bonferroni). More complex than one-way due to multiple factors."
    }
];

async function addANOVA() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // Insert Topics 16, 17, 18
        console.log("Inserting Topic 16 (F-Distribution)...");
        await client.query("INSERT INTO topics (id, name) VALUES (16, '16. F-Distribution')");

        console.log("Inserting Topic 17 (One-Way ANOVA)...");
        await client.query("INSERT INTO topics (id, name, teacher_preferred_approach) VALUES (17, '17. One-Way ANOVA', $1)", [TOPIC_APPROACH_ONEWAY]);

        console.log("Inserting Topic 18 (Two-Way ANOVA)...");
        await client.query("INSERT INTO topics (id, name, teacher_preferred_approach) VALUES (18, '18. Two-Way ANOVA', $1)", [TOPIC_APPROACH_TWOWAY]);

        // Seed Patterns

        // Topic 16: F-Distribution
        console.log("Seeding Topic 16 (F-Distribution)...");
        for (const p of PATTERNS_F_DIST) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [16, p.pattern, p.approach]
            );
        }

        // Topic 17: One-Way ANOVA
        console.log("Seeding Topic 17 (One-Way ANOVA)...");
        for (const p of PATTERNS_ONEWAY) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [17, p.pattern, p.approach]
            );
        }

        // Topic 18: Two-Way ANOVA
        console.log("Seeding Topic 18 (Two-Way ANOVA)...");
        for (const p of PATTERNS_TWOWAY) {
            await client.query(
                "INSERT INTO patterns (topic_id, pattern, teacher_preferred_approach, gemini_generated) VALUES ($1, $2, $3, false)",
                [18, p.pattern, p.approach]
            );
        }

        console.log("✅ ANOVA topics added successfully!");
    } catch (err) {
        console.error("Addition failed:", err);
    } finally {
        await client.end();
    }
}

addANOVA();
