import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { FileText, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (!error) {
        toast({
          title: "წარმატებული ავტორიზაცია",
          description: "მოგესალმებით Invoiso-ში!",
        });
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Login error:", err);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: "სისტემური შეცდომა. გთხოვთ სცადოთ მოგვიანებით.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>შესვლა - Invoiso</title>
        <meta name="description" content="შედით თქვენს ანგარიშზე" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-4 py-8">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="bg-indigo-100 p-3 rounded-full mb-4 shadow-inner">
                <FileText className="h-10 w-10 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Invoiso</h1>
              <p className="text-slate-500 mt-2 font-medium">სისტემაში შესვლა</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                  ელ-ფოსტა
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 placeholder:text-slate-400"
                    placeholder="info@invoiso.ge"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                  პაროლი
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:-translate-y-0.5 mt-2"
              >
                {loading ? 'შესვლა...' : 'შესვლა'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-500 text-sm mb-3">არ გაქვთ ანგარიში?</p>
                <Link 
                    to="/demo-request" 
                    className="inline-flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold hover:underline transition-all group"
                >
                    დემო მოთხოვნა <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
          </motion.div>
          <p className="text-center text-slate-400 text-xs mt-8">
             &copy; {new Date().getFullYear()} Invoiso. ყველა უფლება დაცულია.
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;