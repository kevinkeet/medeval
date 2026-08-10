/**
 * Risk Calculators
 *
 * Implementations of common clinical risk calculators
 */

const RiskCalculators = {
    /**
     * CHA₂DS₂-VASc Score for stroke risk in atrial fibrillation
     * Returns score 0-9 and annual stroke risk percentage
     */
    calculateCHADS2VASc: function(patientData) {
        let score = 0;

        // C - Congestive heart failure (1 point)
        if (patientData.chfHistory || patientData.ef < 40) score += 1;

        // H - Hypertension (1 point)
        if (patientData.htnTreatment || patientData.systolicBP >= 140) score += 1;

        // A₂ - Age ≥75 (2 points)
        if (patientData.age >= 75) score += 2;
        // A - Age 65-74 (1 point)
        else if (patientData.age >= 65) score += 1;

        // D - Diabetes (1 point)
        if (patientData.diabetesStatus === 'type2' || patientData.diabetesStatus === 'type1') score += 1;

        // S₂ - Stroke/TIA/thromboembolism (2 points)
        if (patientData.priorStroke) score += 2;

        // V - Vascular disease (1 point)
        if (patientData.priorMI || patientData.pvd) score += 1;

        // Sc - Sex category - female (1 point)
        if (patientData.sex === 'female') score += 1;

        // Annual stroke risk by score (approximate from literature)
        const strokeRiskByScore = {
            0: 0.2, 1: 0.6, 2: 2.2, 3: 3.2, 4: 4.8,
            5: 7.2, 6: 9.7, 7: 11.2, 8: 10.8, 9: 12.2
        };

        return {
            score: score,
            annualStrokeRisk: strokeRiskByScore[Math.min(score, 9)] || 12.2,
            interpretation: score === 0 ? 'Low risk' :
                           score === 1 ? 'Low-moderate risk' :
                           score >= 2 ? 'Moderate-high risk (anticoagulation recommended)' : ''
        };
    },

    /**
     * HAS-BLED Score for bleeding risk on anticoagulation
     * Returns score 0-9 and annual major bleeding risk
     */
    calculateHASBLED: function(patientData) {
        let score = 0;

        // H - Hypertension (uncontrolled, SBP >160)
        if (patientData.systolicBP > 160) score += 1;

        // A - Abnormal renal/liver function (1 point each)
        if (patientData.creatinine > 2.3 || patientData.egfr < 30) score += 1;
        if (patientData.liverDisease) score += 1;

        // S - Stroke history
        if (patientData.priorStroke) score += 1;

        // B - Bleeding history or predisposition
        if (patientData.priorBleed || patientData.anemia) score += 1;

        // L - Labile INR (assume if on warfarin without good control data)
        // Skip for now unless we track this

        // E - Elderly (>65)
        if (patientData.age > 65) score += 1;

        // D - Drugs (antiplatelet, NSAIDs) or alcohol
        if (patientData.nsaidUse || patientData.antiplatelet) score += 1;
        if (patientData.alcohol) score += 1;

        // Annual major bleeding risk by score
        const bleedRiskByScore = {
            0: 1.1, 1: 1.0, 2: 1.9, 3: 3.7, 4: 8.7, 5: 12.5
        };

        return {
            score: score,
            annualBleedRisk: bleedRiskByScore[Math.min(score, 5)] || 12.5,
            interpretation: score <= 2 ? 'Low-moderate bleeding risk' :
                           score >= 3 ? 'High bleeding risk - caution with anticoagulation' : ''
        };
    },

    /**
     * Pooled Cohort Equations (ASCVD Risk Calculator)
     * 10-year risk of atherosclerotic cardiovascular disease
     */
    calculateASCVDRisk: function(patientData) {
        // Simplified version - full calculation requires natural log coefficients
        // This is an approximation for demonstration

        if (!patientData.age || !patientData.totalCholesterol || !patientData.hdl ||
            !patientData.systolicBP || !patientData.sex) {
            return { risk: null, interpretation: 'Insufficient data' };
        }

        let baseRisk = 0;
        const age = patientData.age;
        const isMale = patientData.sex === 'male';
        const isBlack = patientData.race === 'black';

        // Age contribution
        if (isMale) {
            baseRisk = (age - 40) * 0.8;
        } else {
            baseRisk = (age - 40) * 0.5;
        }

        // Cholesterol contribution
        const tcHdlRatio = patientData.totalCholesterol / patientData.hdl;
        baseRisk += (tcHdlRatio - 4) * 1.5;

        // Blood pressure contribution
        const sbp = patientData.systolicBP;
        if (patientData.htnTreatment) {
            baseRisk += (sbp - 120) * 0.08;
        } else {
            baseRisk += (sbp - 120) * 0.05;
        }

        // Smoking
        if (patientData.smoker) baseRisk += 4;

        // Diabetes
        if (patientData.diabetesStatus === 'type2' || patientData.diabetesStatus === 'type1') {
            baseRisk += isMale ? 3 : 5;
        }

        // Race adjustment
        if (isBlack) {
            baseRisk *= isMale ? 1.1 : 1.3;
        }

        // Convert to percentage (simplified sigmoid-like function)
        let risk = 1 / (1 + Math.exp(-0.15 * (baseRisk - 10))) * 30;
        risk = Math.max(0.5, Math.min(risk, 50)); // Cap between 0.5% and 50%

        return {
            risk: risk.toFixed(1),
            interpretation: risk < 5 ? 'Low risk (<5%)' :
                           risk < 7.5 ? 'Borderline risk (5-7.5%)' :
                           risk < 20 ? 'Intermediate risk (7.5-20%)' :
                           'High risk (≥20%)'
        };
    },

    /**
     * Framingham Heart Failure Risk Score (simplified)
     */
    calculateHFRisk: function(patientData) {
        if (!patientData.age) return { risk: null };

        let points = 0;

        // Age points (simplified)
        points += Math.floor((patientData.age - 45) / 5) * 2;

        // Hypertension
        if (patientData.htnTreatment || patientData.systolicBP >= 140) points += 2;

        // Diabetes
        if (patientData.diabetesStatus === 'type2' || patientData.diabetesStatus === 'type1') points += 3;

        // Prior MI
        if (patientData.priorMI) points += 4;

        // LVH/cardiomegaly (use EF as proxy)
        if (patientData.ef && patientData.ef < 50) points += 3;

        // BMI (if available)
        if (patientData.weight && patientData.height) {
            const bmi = patientData.weight / Math.pow(patientData.height / 100, 2);
            if (bmi >= 30) points += 2;
        }

        // Convert to 10-year risk (simplified)
        const risk = Math.min(points * 1.5, 40);

        return {
            points: points,
            risk: risk.toFixed(1),
            interpretation: risk < 5 ? 'Low risk' :
                           risk < 10 ? 'Moderate risk' :
                           risk < 20 ? 'High risk' :
                           'Very high risk'
        };
    },

    /**
     * UKPDS Risk Engine (simplified) for diabetes complications
     * 10-year risk of CHD, stroke, etc.
     */
    calculateUKPDSRisk: function(patientData) {
        if (patientData.diabetesStatus !== 'type2' && patientData.diabetesStatus !== 'type1') {
            return { chdRisk: null, strokeRisk: null };
        }

        const age = patientData.age || 60;
        const duration = patientData.diabetesDuration || 5;
        const a1c = patientData.a1c || 7.5;
        const sbp = patientData.systolicBP || 135;
        const tcHdlRatio = patientData.totalCholesterol && patientData.hdl ?
            patientData.totalCholesterol / patientData.hdl : 5;

        // Simplified CHD risk
        let chdRisk = 5; // Base 5%
        chdRisk += (age - 50) * 0.3;
        chdRisk += duration * 0.5;
        chdRisk += (a1c - 6.5) * 2;
        chdRisk += (sbp - 120) * 0.1;
        chdRisk += (tcHdlRatio - 4) * 1.5;
        if (patientData.smoker) chdRisk *= 1.5;
        if (patientData.sex === 'male') chdRisk *= 1.2;

        // Simplified stroke risk
        let strokeRisk = 3;
        strokeRisk += (age - 50) * 0.2;
        strokeRisk += duration * 0.3;
        strokeRisk += (sbp - 120) * 0.08;
        if (patientData.afib) strokeRisk *= 2;

        return {
            chdRisk: Math.min(Math.max(chdRisk, 1), 50).toFixed(1),
            strokeRisk: Math.min(Math.max(strokeRisk, 1), 30).toFixed(1),
            interpretation: {
                chd: chdRisk < 10 ? 'Low-moderate' : chdRisk < 20 ? 'Moderate-high' : 'High',
                stroke: strokeRisk < 5 ? 'Low' : strokeRisk < 10 ? 'Moderate' : 'High'
            }
        };
    },

    /**
     * Seattle Heart Failure Model (simplified)
     * Estimates 1, 2, and 5-year survival
     */
    calculateSeattleHFSurvival: function(patientData) {
        if (!patientData.ef || patientData.ef >= 50) {
            return { survival1yr: null, interpretation: 'Not applicable (EF ≥50% or unknown)' };
        }

        const age = patientData.age || 65;
        const ef = patientData.ef;
        const nyha = parseInt(patientData.nyha) || 2;
        const sbp = patientData.systolicBP || 110;
        const creatinine = patientData.creatinine || 1.2;

        // Simplified survival calculation
        let riskScore = 0;
        riskScore += (age - 60) * 0.02;
        riskScore += (40 - ef) * 0.02;
        riskScore += (nyha - 2) * 0.15;
        riskScore -= (sbp - 100) * 0.005;
        riskScore += (creatinine - 1) * 0.1;

        if (patientData.diabetesStatus === 'type2') riskScore += 0.1;
        if (patientData.afib) riskScore += 0.05;

        // Calculate survival (simplified exponential model)
        const survival1yr = Math.max(0.4, Math.min(0.95, 0.9 - riskScore));
        const survival2yr = Math.pow(survival1yr, 1.8);
        const survival5yr = Math.pow(survival1yr, 4);

        // Estimate life-years gained from GDMT
        const gdmtBenefit = {
            betaBlocker: (1 - survival5yr) * 0.35 * 5,
            mra: (1 - survival5yr) * 0.30 * 5,
            arni: (1 - survival5yr) * 0.20 * 5,
            sglt2i: (1 - survival5yr) * 0.25 * 5
        };

        return {
            survival1yr: (survival1yr * 100).toFixed(0),
            survival2yr: (survival2yr * 100).toFixed(0),
            survival5yr: (survival5yr * 100).toFixed(0),
            potentialGDMTBenefit: gdmtBenefit,
            interpretation: survival1yr >= 0.85 ? 'Good prognosis' :
                           survival1yr >= 0.70 ? 'Moderate prognosis' :
                           'Poor prognosis - aggressive therapy warranted'
        };
    },

    /**
     * eGFR Calculation (CKD-EPI 2021)
     */
    calculateEGFR: function(patientData) {
        if (!patientData.creatinine || !patientData.age) return null;

        const cr = patientData.creatinine;
        const age = patientData.age;
        const isFemale = patientData.sex === 'female';

        // CKD-EPI 2021 (race-free)
        const kappa = isFemale ? 0.7 : 0.9;
        const alpha = isFemale ? -0.241 : -0.302;
        const scr_k = cr / kappa;

        let egfr;
        if (scr_k <= 1) {
            egfr = 142 * Math.pow(scr_k, alpha) * Math.pow(0.9938, age);
        } else {
            egfr = 142 * Math.pow(scr_k, -1.200) * Math.pow(0.9938, age);
        }

        if (isFemale) egfr *= 1.012;

        return {
            egfr: Math.round(egfr),
            stage: egfr >= 90 ? 'G1 (Normal)' :
                   egfr >= 60 ? 'G2 (Mild)' :
                   egfr >= 45 ? 'G3a (Mild-Mod)' :
                   egfr >= 30 ? 'G3b (Mod-Severe)' :
                   egfr >= 15 ? 'G4 (Severe)' :
                   'G5 (Kidney Failure)'
        };
    },

    /**
     * Calculate all applicable risks for a patient
     */
    calculateAllRisks: function(patientData) {
        const results = {};

        // ASCVD Risk
        results.ascvd = this.calculateASCVDRisk(patientData);

        // AFib-related scores (only if has AFib)
        if (patientData.afib) {
            results.chadsvasc = this.calculateCHADS2VASc(patientData);
            results.hasbled = this.calculateHASBLED(patientData);
        }

        // Heart failure (only if EF reduced or HF symptoms)
        if ((patientData.ef && patientData.ef < 50) || parseInt(patientData.nyha) > 0) {
            results.seattleHF = this.calculateSeattleHFSurvival(patientData);
            results.hfRisk = this.calculateHFRisk(patientData);
        }

        // Diabetes risks
        if (patientData.diabetesStatus === 'type2' || patientData.diabetesStatus === 'type1') {
            results.ukpds = this.calculateUKPDSRisk(patientData);
        }

        // eGFR
        if (patientData.creatinine) {
            results.egfr = this.calculateEGFR(patientData);
        }

        return results;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RiskCalculators;
}
