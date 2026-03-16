import React, { useState } from 'react';
import { ArrowLeft, Calendar, ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InternshipApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    whatsapp: '',
    college: '',
    registration: '',
    department: 'Computer Science',
    semester: '',
    passingYear: '',
    interests: {
      aptitudeTest: false,
      placement: false,
      industrialInternship: false,
      plantTraining: false,
    },
    technicalSkills: '',
    address: '',
    source: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: keyof typeof formData.interests) => {
    setFormData((prev) => ({
      ...prev,
      interests: {
        ...prev.interests,
        [name]: !prev.interests[name],
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add logic here to send data to the backend
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#0f172a] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl overflow-hidden border border-[#e5e7eb] dark:border-gray-700 transition-colors duration-200">
          
          {/* Header Section */}
          <div className="pt-8 px-6 sm:px-10 relative">
            <button
              onClick={() => navigate(-1)}
              className="absolute top-8 left-6 sm:left-10 flex items-center text-gray-500 dark:text-gray-400 hover:text-[#1f4fa3] dark:hover:text-blue-400 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span>Back</span>
            </button>
            
            <div className="text-center mt-12 sm:mt-0">
              <h1 className="text-3xl font-bold text-[#1f4fa3] dark:text-blue-400 tracking-wide uppercase">
                Internship Application
              </h1>
              <p className="mt-2 text-sm text-[#6b7280] dark:text-gray-400 font-medium tracking-wide pb-6 border-b border-[#e5e7eb] dark:border-gray-700">
                SoVir Technologies — Industrial Training Portal
              </p>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-12">
            
            {/* Section 1: Personal Identity */}
            <section>
              <div className="flex items-center mb-6">
                <h2 className="text-sm font-bold text-[#1f4fa3] dark:text-blue-400 uppercase tracking-widest mr-4 whitespace-nowrap">
                  Personal Identity
                </h2>
                <div className="h-px bg-[#e5e7eb] dark:bg-gray-700 flex-grow"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group relative">
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb]"
                    required
                  />
                </div>
                <div className="group relative">
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb]"
                    required
                  />
                </div>
                <div className="group relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb] appearance-none"
                    required
                  />
                </div>
                <div className="group relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Professional Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb]"
                    required
                  />
                </div>
                <div className="group relative md:col-span-2">
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    placeholder="WhatsApp Number"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb]"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Academic Background */}
            <section>
              <div className="flex items-center mb-6">
                <h2 className="text-sm font-bold text-[#1f4fa3] dark:text-blue-400 uppercase tracking-widest mr-4 whitespace-nowrap">
                  Academic Background
                </h2>
                <div className="h-px bg-[#e5e7eb] dark:bg-gray-700 flex-grow"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group relative md:col-span-2">
                  <input
                    type="text"
                    id="college"
                    name="college"
                    placeholder="College / University Name"
                    value={formData.college}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb]"
                    required
                  />
                </div>
                <div className="group relative">
                  <input
                    type="text"
                    id="registration"
                    name="registration"
                    placeholder="Registration Number"
                    value={formData.registration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb]"
                    required
                  />
                </div>
                <div className="group relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 dark:text-gray-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb] appearance-none"
                    required
                  >
                    <option value="" disabled>Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Civil">Civil</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="group relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 dark:text-gray-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb] appearance-none"
                    required
                  >
                    <option value="" disabled>Current Semester</option>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="3rd Semester">3rd Semester</option>
                    <option value="4th Semester">4th Semester</option>
                    <option value="5th Semester">5th Semester</option>
                    <option value="6th Semester">6th Semester</option>
                    <option value="7th Semester">7th Semester</option>
                    <option value="8th Semester">8th Semester</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
                <div className="group relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 dark:text-gray-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                  <select
                    name="passingYear"
                    value={formData.passingYear}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb] appearance-none"
                    required
                  >
                    <option value="" disabled>Passing Year</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Section 3: Interests & Logistics */}
            <section>
              <div className="flex items-center mb-6">
                <h2 className="text-sm font-bold text-[#1f4fa3] dark:text-blue-400 uppercase tracking-widest mr-4 whitespace-nowrap">
                  Interests & Logistics
                </h2>
                <div className="h-px bg-[#e5e7eb] dark:bg-gray-700 flex-grow"></div>
              </div>

              <div className="bg-[#f9fafb] dark:bg-slate-800/50 p-6 rounded-xl border border-[#e5e7eb] dark:border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'aptitudeTest', label: 'Aptitude Test' },
                    { id: 'placement', label: 'Placement' },
                    { id: 'industrialInternship', label: 'Industrial Internship' },
                    { id: 'plantTraining', label: 'Plant Training' },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={formData.interests[item.id as keyof typeof formData.interests]}
                          onChange={() => handleCheckboxChange(item.id as keyof typeof formData.interests)}
                        />
                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-800 peer-checked:bg-[#1f4fa3] peer-checked:border-[#1f4fa3] transition-colors flex items-center justify-center">
                          <Check className={`w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity`} />
                        </div>
                      </div>
                      <span className="text-[#111827] dark:text-[#e5e7eb] text-sm font-medium group-hover:text-[#1f4fa3] dark:group-hover:text-blue-400 transition-colors">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="group relative">
                  <textarea
                    name="technicalSkills"
                    placeholder="List your key technical skills (e.g., C++, PLC, Arduino, SCADA, HMI)..."
                    value={formData.technicalSkills}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb] resize-y"
                  ></textarea>
                </div>

                <div className="group relative">
                  <textarea
                    name="address"
                    placeholder="Current Residential Address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb] resize-y"
                    required
                  ></textarea>
                </div>

                <div className="group relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 dark:text-gray-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1f4fa3] dark:focus:ring-blue-500 focus:border-[#1f4fa3] dark:focus:border-blue-500 outline-none transition-all duration-200 text-[#111827] dark:text-[#e5e7eb] appearance-none"
                    required
                  >
                    <option value="" disabled>How did you hear about us?</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="College Faculty">College Faculty</option>
                    <option value="Friends / Alumni">Friends / Alumni</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Internet Search">Internet Search</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-[#1f4fa3] hover:bg-[#173c7d] text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
              >
                Submit Application
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default InternshipApplicationPage;
