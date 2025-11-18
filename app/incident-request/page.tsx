'use client';

import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { ShieldAlert, ExternalLink, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const INCIDENT_VIDEO_URL =
  'https://dmsncyknmivvutrhcfhi.supabase.co/storage/v1/object/public/incedent%20video/How%20to%20create%20an%20incident.mp4';

const IncidentRequestPage = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    setVideoUrl(INCIDENT_VIDEO_URL);
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-20 flex-1 min-h-screen p-8 transition-all duration-300">
        <PageHeader
          title="Incident / Issue Request"
          description="Report hardware or software problems directly to IT via ServiceNow"
          icon={<ShieldAlert className="w-8 h-8 text-blue-600" />}
        />

        <div className="bg-white dark:bg-gray-800 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg shadow-md p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">When to Submit an Incident?</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Hardware failures (laptop, monitor, peripherals).</li>
              <li>Software issues or access problems.</li>
              <li>Network / VPN connectivity issues.</li>
              <li>Follow-up on an existing ticket or request.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Before submitting:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>Describe the issue clearly (what happened, when, and any error messages).</li>
              <li>Include the affected asset number or serial if applicable.</li>
              <li>Attach screenshots/logs if they help explain the problem.</li>
            </ul>
          </div>

          {videoUrl && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Watch: How to submit an incident</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Short walkthrough video demonstrating the ServiceNow incident form.
                  </p>
                </div>
              </div>
              <video
                className="w-full max-w-2xl rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm mx-auto"
                controls
                controlsList="nodownload"
                preload="metadata"
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          <a
            href="https://tmrphelpdesk.service-now.com/sp?id=sc_cat_item&sys_id=3f1dd0320a0a0b99000a53f7604a2ef9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-semibold shadow hover:shadow-lg transition-all"
          >
            Open Incident Request Form
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      </main>
    </div>
  );
};

export default IncidentRequestPage;

