import { Clock, AlertCircle } from "lucide-react";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export const CycleMeter = ({ remaining }) => (
  <div className="text-center space-y-2">
    <div className="h-24 w-24 mx-auto">
      <CircularProgressbar
        value={70 - remaining}
        maxValue={70}
        text={`${remaining}h`}
        styles={{
          path: {
            stroke: remaining > 20 ? '#16a34a' : remaining > 10 ? '#d97706' : '#dc2626',
          },
          text: {
            fill: '#1f2937',
            fontSize: '24px',
          }
        }}
      />
    </div>
    <p className="text-sm text-gray-600">
      70/8 Hour Cycle Remaining
    </p>
  </div>
);

export const ComplianceCard = ({ violations }) => (
  <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
    <div className="flex items-center mb-3">
      <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
      <h4 className="text-base font-semibold text-red-800">Compliance Alerts</h4>
    </div>
    <div className="space-y-2">
      {violations.length > 0 ? (
        violations.map((violation, index) => (
          <div key={index} className="text-sm text-red-700">
            • {violation}
          </div>
        ))
      ) : (
        <div className="text-sm text-green-700">
          ✓ All requirements met
        </div>
      )}
    </div>
  </div>
);
