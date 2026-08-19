/**
 * Client-side calculation helpers for live ROI simulator & campaign estimators
 */

export const calculateLiveRoi = ({
  predictedBaselineDemand = 213,
  totalSamples = 10000,
  medicinePrice = 120,
  sampleCost = 0.0587,
  expectedSampleLift = 0.10, // 10%
  unitsPerPrescription = 2,
  variableCostPerUnit = 45,
}) => {
  const sampleInvestment = totalSamples * sampleCost
  const expectedIncrementalRx = predictedBaselineDemand * expectedSampleLift
  const expectedIncrementalUnits = expectedIncrementalRx * unitsPerPrescription
  const expectedRevenue = expectedIncrementalUnits * medicinePrice
  const expectedVariableCost = expectedIncrementalUnits * variableCostPerUnit
  const expectedIncrementalProfit = expectedRevenue - expectedVariableCost
  
  const projectedRoiPercent = sampleInvestment > 0 
    ? ((expectedIncrementalProfit - sampleInvestment) / sampleInvestment) * 100 
    : 0

  const marginPerUnit = Math.max(0, medicinePrice - variableCostPerUnit)
  const breakevenIncrementalRx = (unitsPerPrescription * marginPerUnit) > 0
    ? sampleInvestment / (unitsPerPrescription * marginPerUnit)
    : 0
    
  const breakevenSampleLift = predictedBaselineDemand > 0
    ? (breakevenIncrementalRx / predictedBaselineDemand)
    : 0

  const breakevenSamples = expectedIncrementalProfit > 0 && sampleCost > 0
    ? Math.round(expectedIncrementalProfit / sampleCost)
    : 0

  return {
    sampleInvestment,
    predictedBaselineDemand,
    expectedIncrementalRx,
    expectedIncrementalUnits,
    expectedRevenue,
    expectedVariableCost,
    expectedIncrementalProfit,
    projectedRoiPercent,
    breakevenIncrementalRx,
    breakevenSampleLift,
    breakevenSamples,
  }
}

export const generateSensitivityGrid = ({
  predictedBaselineDemand = 213,
  totalSamples = 10000,
  sampleCost = 0.0587,
  unitsPerPrescription = 2,
  variableCostPerUnit = 45,
}) => {
  const lifts = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50]
  const prices = [80, 120, 160, 200, 250, 300]
  
  return lifts.map((lift) => {
    const row = {
      liftPercent: `${Math.round(lift * 100)}%`,
      liftValue: lift,
    }
    prices.forEach((price) => {
      const res = calculateLiveRoi({
        predictedBaselineDemand,
        totalSamples,
        medicinePrice: price,
        sampleCost,
        expectedSampleLift: lift,
        unitsPerPrescription,
        variableCostPerUnit,
      })
      row[`price_${price}`] = Math.round(res.projectedRoiPercent * 10) / 10
    })
    return row
  })
}
