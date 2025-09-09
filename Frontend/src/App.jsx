"use client"

import { useState, useEffect } from "react"
import Header from "./components/Header"
import SearchForm from "./components/SearchForm"
import ResultsGrid from "./components/ResultsGrid"
import Loader from "./components/Loader"
import { fetchEncoders } from "./api"

function App() {
  const [encoders, setEncoders] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  // Load encoders on component mount
  useEffect(() => {
    const loadEncoders = async () => {
      try {
        const encoderData = await fetchEncoders()
        setEncoders(encoderData)
      } catch (err) {
        console.warn("Failed to load encoders from API, using fallback data")
        // Fallback encoder options if API is not available
        setEncoders({
          Climate: ["Tropical", "Temperate", "Arid", "Continental", "Mediterranean"],
          BudgetLevel: ["Low", "Medium", "High"],
          Accessibility: ["Easy", "Moderate", "Difficult"],
        })
      }
    }
    loadEncoders()
  }, [])

  const handleSearchResults = (searchResults) => {
    setResults(searchResults)
    setHasSearched(true)
    setError("")
  }

  const handleSearchError = (errorMessage) => {
    setError(errorMessage)
    setResults([])
    setHasSearched(true)
  }

  const handleLoadingChange = (isLoading) => {
    setLoading(isLoading)
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <SearchForm
          encoders={encoders}
          onResults={handleSearchResults}
          onError={handleSearchError}
          onLoadingChange={handleLoadingChange}
        />
        {loading && <Loader />}
        {error && (
          <div className="error-message">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}
        {!loading && hasSearched && !error && <ResultsGrid results={results} />}
      </main>
    </div>
  )
}

export default App
