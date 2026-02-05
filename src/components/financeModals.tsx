import { companyId } from "../constants/appConstants";
import { Asset, Budget, Expense } from "../data/mockData";

interface FinanceData{
  expenses: Expense[];
  assets: Asset[];
  budgets: Budget[];
}

interface FormDataState {
  name?: string;
  category?: string;
  description?: string;
  amount?: number;
  value?: number;
  type?: string;
  date?: string;
  depreciation_rate?: string;
  purchase_date?: string;
  allocated?: number;
  method?: string;
  recorded_by?: string;
}

interface ModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (formData: FormDataState, company_id: string, transactionId?: string) => void;
  formData: FormDataState;
  onFormChange: (field: keyof FormDataState, value: string) => void;
  loading: boolean;
  transactionId?: string;
}

 // Add Expense Modal
  export const ExpenseModal: React.FC<ModalProps> = ({ show, onClose, onSubmit, formData, onFormChange, loading }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add New Expense</h3>
          <button 
            onClick={() => onClose()}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <form className="space-y-4"  onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData, companyId); 
        }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              name ="description"
              value={formData.description}
              onChange={e => onFormChange('description', e.target.value )}
              type="text"
              placeholder="Enter expense description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <input
              value={formData.amount || ''}
              onChange={e => onFormChange('amount', e.target.value )}
              type="number"
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={e => onFormChange('category',  e.target.value )}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              <option value="Operations">Operations</option>
              <option value="Technology">Technology</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              value={formData.date}
              required
              onChange={e => onFormChange('date', e.target.value )}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Adding expense...
                </div>
              ) : (
                'Add Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

export const AssetModal: React.FC<ModalProps>  = ({ show, onClose, onSubmit, formData, onFormChange, loading }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl max-w-md w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Add New Asset</h3>
        <button 
          onClick={() => onClose()}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData, companyId); 
        }}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Asset Name</label>
          <input
            value={formData.name}
            onChange={e => onFormChange('name', e.target.value )}
            type="text"
            placeholder="Enter asset name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
           value={formData.category}
              onChange={e => onFormChange('category', e.target.value )}
              >
            <option>Select type</option>
            <option>Real Estate</option>
            <option>Technology</option>
            <option>Transportation</option>
            <option>Equipment</option>
            <option>Furniture</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
          <input
            value={formData.value}
            onChange={e => onFormChange('value', e.target.value )}
            type="number"
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
          <input
            value={formData.date}
            required
            onChange={e => onFormChange('date', e.target.value )}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Annual Depreciation (%)</label>
          <input
            value={formData.depreciation_rate}
            onChange={e => onFormChange('depreciation_rate', e.target.value )}
            type="number"
            placeholder="5"
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={() => onClose()}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
             {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Adding asset...
                </div>
              ) : (
                'Add Asset'
              )}
          </button>
        </div>
      </form>
    </div>
  </div>
);

  export const PaymentModal: React.FC<ModalProps> = ({ show, onClose, onSubmit, formData, onFormChange, loading }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add New Payment</h3>
          <button 
            onClick={() => onClose()}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <form className="space-y-4"  onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData, companyId); 
        }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              name ="description"
              value={formData.description}
              onChange={e => onFormChange('description', e.target.value )}
              type="text"
              required
              placeholder="Enter payment description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <input
              value={formData.amount || ''}
              required
              onChange={e => onFormChange('amount', e.target.value )}
              type="number"
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={e => onFormChange('category',  e.target.value )}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              <option value="Operations">Operations</option>
              <option value="Technology">Technology</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
            <select
              value={formData.method}
              required
              onChange={e => onFormChange('method',  e.target.value )}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select method</option>
              <option value="Cash">Cash</option>
              <option value="Momo">Mobile Money</option>
              
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              value={formData.date}
              required
              onChange={e => onFormChange('date', e.target.value )}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Adding payment...
                </div>
              ) : (
                'Add Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

export const BudgetModal = ({ show, onClose, onSubmit, formData, onFormChange, loading }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl max-w-md w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Add New Float</h3>
        <button 
          onClick={() => onClose()}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData, companyId); 
        }}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount of float</label>
          <input
            value={formData.allocated}
            required
            onChange={e => onFormChange('allocated', e.target.value )}
            type="number"
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Float Date</label>
          <input
            value={formData.date}
            onChange={e => onFormChange('date', e.target.value )}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={() => onClose()}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
             {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Adding budget...
                </div>
              ) : (
                'Add Budget'
              )}
          </button>
        </div>
      </form>
    </div>
  </div>
);



export const CommissionModal: React.FC<ModalProps> = ({ show, onClose, onSubmit, formData, onFormChange, loading, transactionId }) => {
  if (!show) return null;
  console.log('Commission Modal transactionId: ', transactionId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-1">Add Commission</h2>
        <p className="text-xs mb-3">Add commission for this transaction</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              required
              value={formData.amount || ''}
              onChange={(e) => onFormChange('amount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
         
        </div>
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(formData, companyId)}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Adding commission...' : 'Add Commission'}
          </button>
        </div>
      </div>
    </div>
  );
};
