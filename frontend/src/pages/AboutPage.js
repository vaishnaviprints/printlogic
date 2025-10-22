import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Printer, Users, Award, TrendingUp } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-5xl mx-auto px-4 py-12" data-testid="about-page">
        <h1 className="text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          About Vaishnavi Printers
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <p className="text-lg text-gray-700 mb-4">
            Vaishnavi Printers has been serving Hyderabad with professional printing services since 2010. 
            We specialize in fast, high-quality document printing with both pickup and delivery options.
          </p>
          <p className="text-gray-700">
            Our mission is to make professional printing accessible and affordable for everyone - from 
            students and job seekers to businesses and enterprises. We use state-of-the-art printing 
            equipment and offer competitive pricing with no hidden charges.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <StatCard
            icon={<Printer className="w-8 h-8 text-indigo-600" />}
            title="10,000+"
            description="Orders Completed"
          />
          <StatCard
            icon={<Users className="w-8 h-8 text-indigo-600" />}
            title="5,000+"
            description="Happy Customers"
          />
          <StatCard
            icon={<Award className="w-8 h-8 text-indigo-600" />}
            title="15 Years"
            description="Industry Experience"
          />
          <StatCard
            icon={<TrendingUp className="w-8 h-8 text-indigo-600" />}
            title="3 Locations"
            description="Across Bangalore"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Why Choose Us?
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">✓</span>
              <span><strong>Fast Turnaround:</strong> Same-day printing for urgent orders</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">✓</span>
              <span><strong>Quality Guarantee:</strong> Premium paper and professional finishes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">✓</span>
              <span><strong>Transparent Pricing:</strong> Instant estimates with no hidden fees</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">✓</span>
              <span><strong>Flexible Options:</strong> Pickup or delivery to your location</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">✓</span>
              <span><strong>Secure Platform:</strong> Your documents are encrypted and protected</span>
            </li>
          </ul>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

const StatCard = ({ icon, title, description }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 text-center">
    <div className="flex justify-center mb-3">{icon}</div>
    <div className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      {title}
    </div>
    <div className="text-gray-600">{description}</div>
  </div>
);

export default AboutPage;
