'use client';

import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import {
  FileText,
  ExternalLink,
  Shuffle,
  Hash,
  ClipboardList,
  QrCode,
  MapPin,
  UserCircle2,
  Building2,
  CheckSquare,
  SendHorizonal,
} from 'lucide-react';

const steps = [
  {
    icon: Shuffle,
    text: (
      <>
        Select <span className="font-semibold">Transfer</span> or <span className="font-semibold">Receiving</span> in the first field.
      </>
    ),
  },
  {
    icon: Hash,
    text: (
      <>
        Enter the <span className="font-semibold">Asset Number</span>.
      </>
    ),
  },
  {
    icon: ClipboardList,
    text: (
      <>
        Provide the <span className="font-semibold">Asset Description (Brand &amp; Model)</span>.
      </>
    ),
  },
  {
    icon: QrCode,
    text: (
      <>
        Fill in the <span className="font-semibold">Serial Number (S/N)</span>.
      </>
    ),
  },
  {
    icon: MapPin,
    text: (
      <>
        Choose the <span className="font-semibold">Current Location</span> of the employee.
      </>
    ),
  },
  {
    icon: UserCircle2,
    text: (
      <>
        Set the <span className="font-semibold">Sender Name</span> to <span className="font-semibold">BAYAN KHUDHARI</span>.
      </>
    ),
  },
  {
    icon: Building2,
    text: (
      <>
        Set the <span className="font-semibold">Receiving Location</span> to <span className="font-semibold">Jeddah Branch</span>.
      </>
    ),
  },
  {
    icon: CheckSquare,
    text: (
      <>
        Check the acknowledgment box confirming the asset condition and policy.
      </>
    ),
  },
  {
    icon: SendHorizonal,
    text: (
      <>
        Click <span className="font-semibold">Submit</span> to finalize the delivery note.
      </>
    ),
  },
];

const DeliveryNotePage = () => {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen p-8">
        <PageHeader
          title="Delivery Note Request"
          description="Complete this form whenever you transfer or receive an IT asset"
          icon={<FileText className="w-8 h-8 text-yellow-600" />}
        />

        <div className="bg-white dark:bg-gray-800 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg shadow-md p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Step-by-Step Guideline</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please follow the instructions below to correctly fill the Delivery Note form in ServiceNow.
            </p>
            <ol className="space-y-3 text-gray-700 dark:text-gray-300">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-200 font-semibold">
                    {index + 1}
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 text-yellow-700 dark:text-yellow-200">
                        <step.icon className="w-4 h-4" />
                      </span>
                      <p>{step.text}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm text-yellow-900 dark:text-yellow-200">
            <p>
              Ensure the information is accurate before submitting. Incorrect data can delay asset transfers or audits.
            </p>
          </div>

          <a
            href="https://tmrphelpdesk.service-now.com/tac?id=sc_cat_item&sys_id=18f46b17c35b0210cfc22e75e0013135"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg font-semibold shadow hover:shadow-lg transition-all"
          >
            Open Delivery Note Form
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      </main>
    </div>
  );
};

export default DeliveryNotePage;

