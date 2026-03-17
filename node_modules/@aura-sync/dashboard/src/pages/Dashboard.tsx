import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout.tsx';
import CompanyCard from '../components/CompanyCard.tsx';
import { Company } from '@aura-sync/shared';

const Dashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    fetchCompanies();
    const interval = setInterval(fetchCompanies, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost:3000/companies');
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  return (
    <DashboardLayout companies={companies}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {companies.map(company => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;