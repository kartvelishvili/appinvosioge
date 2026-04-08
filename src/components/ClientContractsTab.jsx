import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileSignature, ArrowRight } from 'lucide-react';
import { formatDateDDMMYYYY } from '@/utils/formatDate';
import { Button } from '@/components/ui/button';

const ClientContractsTab = ({ contracts }) => {
  const navigate = useNavigate();

  if (!contracts || contracts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileSignature className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">კონტრაქტები არ მოიძებნა</h3>
        <p className="text-slate-500">ამ კლიენტთან კონტრაქტები ჯერ არ გაფორმებულა</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">კონტრაქტი #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">გაფორმების თარიღი</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">დაწყება</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">დასრულება</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">სტატუსი</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {contracts.map((contract, index) => (
              <motion.tr 
                key={contract.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-slate-50 cursor-pointer"
                onClick={() => navigate(`/contracts/${contract.id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                  {contract.contract_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {formatDateDDMMYYYY(contract.contract_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {formatDateDDMMYYYY(contract.start_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {formatDateDDMMYYYY(contract.end_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    contract.status === 'active' ? 'bg-green-100 text-green-800' : 
                    contract.status === 'terminated' ? 'bg-red-100 text-red-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {contract.status === 'active' ? 'აქტიური' :
                     contract.status === 'terminated' ? 'შეწყვეტილი' : 'დასრულებული'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600">
                     <ArrowRight className="h-4 w-4" />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientContractsTab;