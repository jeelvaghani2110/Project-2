"use client"

import { useState, useEffect } from "react"
import { recommend } from "../api"

function SearchForm({ encoders, onResults, onError, onLoadingChange }) {
  const [formData, setFormData] = useState({
    Location: "India",
    State: "",
    Climate: "",
    BudgetLevel: "",
    AvgCostINR: "",
    PopularityScore: 50,
    AvgTempC: "",
    Rating: 3,
    SafetyIndex: "",
    Accessibility: "",
    TransportCostINR: "",
    top_k: 10,
  })

  const [states, setStates] = useState([])
  const [validationErrors, setValidationErrors] = useState({})

  // Indian states fallback list
  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ]

  // Load states when Location changes to India
  useEffect(() => {
    if (formData.Location === "India") {
      // Try to fetch states from API, fallback to hardcoded list
      fetch("/states?country=India")
        .then((res) => res.json())
        .then((data) => setStates(data))
        .catch(() => setStates(indianStates))
    } else {
      setStates([])
      setFormData((prev) => ({ ...prev, State: "" }))
    }
  }, [formData.Location])

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }))

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.Climate) errors.Climate = "Climate is required"
    if (!formData.BudgetLevel) errors.BudgetLevel = "Budget level is required"
    if (!formData.AvgCostINR) errors.AvgCostINR = "Average cost is required"
    if (!formData.AvgTempC) errors.AvgTempC = "Average temperature is required"
    if (!formData.SafetyIndex) errors.SafetyIndex = "Safety index is required"
    if (!formData.Accessibility) errors.Accessibility = "Accessibility is required"
    if (!formData.TransportCostINR) errors.TransportCostINR = "Transport cost is required"

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onLoadingChange(true)

    try {
      // Prepare payload - exclude top_k from the recommendation payload
      const { top_k, ...payload } = formData

      // Convert empty strings to appropriate defaults for numeric fields
      const processedPayload = {
        ...payload,
        AvgCostINR: Number(payload.AvgCostINR),
        PopularityScore: Number(payload.PopularityScore),
        AvgTempC: Number(payload.AvgTempC),
        Rating: Number(payload.Rating),
        SafetyIndex: Number(payload.SafetyIndex),
        TransportCostINR: Number(payload.TransportCostINR),
      }

      const results = await recommend(processedPayload, top_k || 10)
      onResults(results)
    } catch (error) {
      onError(error.message || "Failed to get recommendations. Please try again.")
    } finally {
      onLoadingChange(false)
    }
  }

  if (!encoders) {
    return <div className="loading-encoders">Loading form options...</div>
  }

  return (
    <div className="search-form-container">
      <form onSubmit={handleSubmit} className="search-form">
        <h2>Find Your Perfect Destination</h2>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="Location">Location *</label>
            <select id="Location" name="Location" value={formData.Location} onChange={handleInputChange} required>
              <option value="India">India</option>
              <option value="Outside India">Outside India</option>
            </select>
          </div>

          {formData.Location === "India" && (
            <div className="form-group">
              <label htmlFor="State">State</label>
              <select id="State" name="State" value={formData.State} onChange={handleInputChange}>
                <option value="">Select State (Optional)</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="Climate">Climate *</label>
            <select id="Climate" name="Climate" value={formData.Climate} onChange={handleInputChange} required>
              <option value="">Select Climate</option>
              {encoders.Climate?.map((climate) => (
                <option key={climate} value={climate}>
                  {climate}
                </option>
              ))}
            </select>
            {validationErrors.Climate && <span className="error">{validationErrors.Climate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="BudgetLevel">Budget Level *</label>
            <select
              id="BudgetLevel"
              name="BudgetLevel"
              value={formData.BudgetLevel}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Budget Level</option>
              {encoders.BudgetLevel?.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            {validationErrors.BudgetLevel && <span className="error">{validationErrors.BudgetLevel}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="AvgCostINR">Average Cost (INR) *</label>
            <input
              type="number"
              id="AvgCostINR"
              name="AvgCostINR"
              value={formData.AvgCostINR}
              onChange={handleInputChange}
              min="0"
              required
            />
            {validationErrors.AvgCostINR && <span className="error">{validationErrors.AvgCostINR}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="PopularityScore">Popularity Score: {formData.PopularityScore}</label>
            <input
              type="range"
              id="PopularityScore"
              name="PopularityScore"
              value={formData.PopularityScore}
              onChange={handleInputChange}
              min="0"
              max="100"
              className="slider"
            />
          </div>

          <div className="form-group">
            <label htmlFor="AvgTempC">Average Temperature (°C) *</label>
            <input
              type="number"
              id="AvgTempC"
              name="AvgTempC"
              value={formData.AvgTempC}
              onChange={handleInputChange}
              required
            />
            {validationErrors.AvgTempC && <span className="error">{validationErrors.AvgTempC}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="Rating">Rating: {formData.Rating}</label>
            <input
              type="range"
              id="Rating"
              name="Rating"
              value={formData.Rating}
              onChange={handleInputChange}
              min="0"
              max="5"
              step="0.1"
              className="slider"
            />
          </div>

          <div className="form-group">
            <label htmlFor="SafetyIndex">Safety Index *</label>
            <input
              type="number"
              id="SafetyIndex"
              name="SafetyIndex"
              value={formData.SafetyIndex}
              onChange={handleInputChange}
              min="0"
              max="10"
              step="0.1"
              required
            />
            {validationErrors.SafetyIndex && <span className="error">{validationErrors.SafetyIndex}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="Accessibility">Accessibility *</label>
            <select
              id="Accessibility"
              name="Accessibility"
              value={formData.Accessibility}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Accessibility</option>
              {encoders.Accessibility?.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            {validationErrors.Accessibility && <span className="error">{validationErrors.Accessibility}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="TransportCostINR">Transport Cost (INR) *</label>
            <input
              type="number"
              id="TransportCostINR"
              name="TransportCostINR"
              value={formData.TransportCostINR}
              onChange={handleInputChange}
              min="0"
              required
            />
            {validationErrors.TransportCostINR && <span className="error">{validationErrors.TransportCostINR}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="top_k">Number of Results</label>
            <input
              type="number"
              id="top_k"
              name="top_k"
              value={formData.top_k}
              onChange={handleInputChange}
              min="1"
              max="50"
            />
          </div>
        </div>

        <button type="submit" className="submit-btn">
          🔍 Find Destinations
        </button>
      </form>
    </div>
  )
}

export default SearchForm
