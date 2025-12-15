import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import UploadBox from '../components/UploadBox';
import ResultCard from '../components/ResultCard';

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to EcoGuard LakeCity</h1>
      <Navbar/>
      <Hero/>
      <UploadBox/>
      <ResultCard/>
    </div>
  );
};

export default HomePage;
