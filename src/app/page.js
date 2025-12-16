'use client';
import { useState, useEffect } from 'react';
import { Upload, Loader2, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Error getting user location:', error);
      }
    );
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // Base64 string
        setResult(null); // Clear previous results
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      toast.error('Please upload an image first.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: image.split(',')[1], location }), // Send base64 data and location
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug logging
      if (data.success) {
        setResult(data.analysis); // Use the .analysis property
        toast.success('Report Saved! ID: ' + data.reportId);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error(`Failed to analyze image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Gradient Blob */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-md bg-slate-800/70 backdrop-blur-sm rounded-lg shadow-2xl p-6 space-y-6 border border-slate-700">
        <h1 className="text-4xl font-bold text-center text-emerald-400 mb-6">Waste Analyzer</h1>

        {/* Image Upload Box */}
        <div
          className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors relative"
          onClick={() => document.getElementById('image-upload').click()}
        >
          {image ? (
            <img src={image} alt="Preview" className="max-h-64 object-contain mx-auto rounded-md mb-4" />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <Upload className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">Click to upload an image</p>
              <p className="text-sm">PNG, JPG, GIF up to 10MB</p>
            </div>
          )}
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
            disabled={loading}
          />
        </div>

        {/* Location Status */}
        <div className="text-center text-sm text-slate-400">
          {location ? (
            <span className="text-green-400">📍 Location Detected</span>
          ) : (
            'Waiting for location...'
          )}
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyzeImage}
          disabled={!image || loading}
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Waste'
          )}
        </button>

        {/* Result Card */}
        {result && (
          <div className="mt-6 p-6 bg-white/10 backdrop-blur-lg rounded-lg border border-slate-700 shadow-xl space-y-4">
            <h2 className="text-2xl font-semibold text-emerald-300 text-center">Analysis Result</h2>
            <div className="flex items-center space-x-3">
              <MapPin className="text-slate-400" />
              <p className="text-slate-300">
                <span className="font-medium text-emerald-300">Waste Type:</span> {result.wasteType || 'N/A'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {result.severity === 'High' && <AlertTriangle className="text-red-500" />}
              {result.severity === 'Medium' && <AlertTriangle className="text-orange-500" />}
              {result.severity === 'Low' && <CheckCircle className="text-green-500" />}
              {!result.severity && <CheckCircle className="text-slate-400" />}

              <p className="text-slate-300">
                <span className="font-medium text-emerald-300">Severity:</span> {result.severity || 'N/A'}
              </p>
            </div>
            {result.description && (
              <div>
                <p className="font-medium text-emerald-300 mb-1">Description:</p>
                <p className="text-slate-300 text-sm">{result.description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}