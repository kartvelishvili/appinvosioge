import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import DemoRequestForm from '@/components/DemoRequestForm';

const DemoRequestPage = () => {
  return (
    <>
      <Helmet>
        <title>მოითხოვე დემო - Invoiso</title>
        <meta name="description" content="მოითხოვეთ Invoiso-ს დემო ვერსია" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
            >
                <Link to="/login" className="inline-flex items-center text-slate-500 hover:text-indigo-600 font-medium transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    უკან ავტორიზაციაზე
                </Link>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
            >
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center">
                    <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Rocket className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">მოითხოვე დემო</h1>
                    <p className="text-blue-100 max-w-md mx-auto">
                        შეავსეთ ფორმა და ჩვენი გუნდი დაგიკავშირდებათ სისტემის დეტალური პრეზენტაციისთვის.
                    </p>
                </div>

                <div className="p-8 md:p-10">
                    <DemoRequestForm />
                </div>
            </motion.div>
            
            <p className="text-center text-slate-400 text-sm mt-8">
                &copy; {new Date().getFullYear()} Invoiso. ყველა უფლება დაცულია.
            </p>
        </div>
      </div>
    </>
  );
};

export default DemoRequestPage;