import { MeetingForm } from "@/components/meetings/MeetingForm";

export default function NewMeetingPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">New meeting</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Add a meeting and we'll prepare an AI-powered briefing for you.
        </p>
      </div>
      <MeetingForm />
    </div>
  );
}
