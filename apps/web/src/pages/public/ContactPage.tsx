import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    city: 'Karachi',
    interest: 'onboarding_demo',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/platform/contact-inquiries', form);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Pakistan Wholesale Support
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Talk with Our Onboarding Specialists
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Whether you need assistance importing your 5,000-item catalog or setting up your WhatsApp Cloud API, our team is ready to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Contact Info Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Direct Support Channels</h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Phone Support</span>
                  <span className="text-slate-600">+92 (21) 3456-7890</span>
                  <p className="text-[11px] text-slate-400">Monday - Saturday (9:00 AM - 7:00 PM PKT)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">WhatsApp Onboarding Hotline</span>
                  <span className="text-slate-600">+92 300 9876543</span>
                  <p className="text-[11px] text-slate-400">Direct chat with onboarding engineer</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Email Inquiries</span>
                  <span className="text-slate-600">support@metriflow.pk</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Office Locations</span>
            </div>
            <p className="text-slate-600">
              <strong>Karachi:</strong> Suite 402, Trade Center, I.I. Chundrigar Road<br />
              <strong>Lahore:</strong> 2nd Floor, Siddiq Trade Centre, Main Boulevard Gulberg
            </p>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-lg">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Send an Inquiry or Request a Demo</h2>
          <p className="text-xs text-slate-500 mb-6">
            Fill in your details and an onboarding specialist will get in touch with you.
          </p>

          {submitted ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-900">Inquiry Sent Successfully!</h3>
              <p className="text-xs text-emerald-700">
                We have registered your request and will contact you via WhatsApp / phone shortly.
              </p>
              <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Tariq Mehmood"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wholesale Business / Organization *</label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Mehmood Traders"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="tariq@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="+92 300 1234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Rawalpindi">Rawalpindi / Islamabad</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Gujranwala">Gujranwala</option>
                    <option value="Other">Other City</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message / Questions</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Tell us what specific features you'd like to see demonstrated..."
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                icon={<Send className="w-4 h-4" />}
                className="w-full"
              >
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
