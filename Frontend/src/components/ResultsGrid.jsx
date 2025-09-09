"use client"

import { useState } from "react"

function ResultsGrid({ results }) {
  const [sortBy, setSortBy] = useState("Rating")
  const [expandedCards, setExpandedCards] = useState(new Set())
  const [savedDestinations, setSavedDestinations] = useState(() => {
    // Load saved destinations from localStorage (only on client side)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("savedDestinations")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  // Sort results based on selected criteria
  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "Rating":
        return b.Rating - a.Rating
      case "AvgCostINR":
        return a.AvgCostINR - b.AvgCostINR
      case "PopularityScore":
        return (b.PopularityScore || 0) - (a.PopularityScore || 0)
      default:
        return 0
    }
  })

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedCards(newExpanded)
  }

  const saveDestination = (destination) => {
    const newSaved = [...savedDestinations, { ...destination, savedAt: new Date().toISOString() }]
    setSavedDestinations(newSaved)
    if (typeof window !== "undefined") {
      localStorage.setItem("savedDestinations", JSON.stringify(newSaved))
    }
  }

  const isDestinationSaved = (destination) => {
    return savedDestinations.some(
      (saved) => saved.Destination === destination.Destination && saved.Country === destination.Country,
    )
  }

  if (results.length === 0) {
    return (
      <div className="no-results">
        <h3>No destinations found</h3>
        <p>Try adjusting your search criteria to find more options.</p>
      </div>
    )
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Recommended Destinations ({results.length})</h2>
        <div className="sort-controls">
          <label htmlFor="sortBy">Sort by:</label>
          <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="Rating">Rating</option>
            <option value="AvgCostINR">Cost (Low to High)</option>
            <option value="PopularityScore">Popularity</option>
          </select>
        </div>
      </div>

      <div className="results-grid">
        {sortedResults.map((destination, index) => (
          <div key={index} className="destination-card">
            <div className="card-header">
              <h3 className="destination-name">{destination.Destination}</h3>
              <div className="rating">⭐ {destination.Rating}</div>
            </div>

            <div className="card-content">
              <div className="location-info">
                <p>
                  <strong>📍 Location:</strong> {destination.Country}
                  {destination.State && `, ${destination.State}`}
                </p>
                {destination.SourceCity && (
                  <p>
                    <strong>🚗 From:</strong> {destination.SourceCity}
                  </p>
                )}
              </div>

              <div className="basic-info">
                <div className="info-item">
                  <span className="label">💰 Cost:</span>
                  <span className="value">₹{destination.AvgCostINR?.toLocaleString()}</span>
                </div>
                <div className="info-item">
                  <span className="label">🌡️ Climate:</span>
                  <span className="value">{destination.Climate}</span>
                </div>
                <div className="info-item">
                  <span className="label">💳 Budget:</span>
                  <span className="value">{destination.BudgetLevel}</span>
                </div>
              </div>

              {expandedCards.has(index) && (
                <div className="expanded-info">
                  <div className="info-grid">
                    {destination.Activities && (
                      <div className="info-item">
                        <span className="label">🎯 Activities:</span>
                        <span className="value">{destination.Activities}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="label">🛡️ Safety Index:</span>
                      <span className="value">{destination.SafetyIndex}/10</span>
                    </div>
                    <div className="info-item">
                      <span className="label">🚌 Transport Cost:</span>
                      <span className="value">₹{destination.TransportCostINR?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card-actions">
              <button onClick={() => toggleExpanded(index)} className="details-btn">
                {expandedCards.has(index) ? "▲ Less Details" : "▼ More Details"}
              </button>
              <button
                onClick={() => saveDestination(destination)}
                className={`save-btn ${isDestinationSaved(destination) ? "saved" : ""}`}
                disabled={isDestinationSaved(destination)}
              >
                {isDestinationSaved(destination) ? "✓ Saved" : "💾 Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResultsGrid
