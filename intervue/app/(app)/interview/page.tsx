"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SessionData } from "@/models/session.model";
export default function Page() {
  const [files, setFiles] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [evaluating, setEvaluating] = useState<string | null>(null);

  const router = useRouter();
  const handleFileUpload = (files: File[]) => {
    setFiles(files[0]);
    console.log(files);
  };
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files) {
      setMessage("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", files);

    try {
      const response = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setMessage("File uploaded successfully!");
        // toast.success("file uploaded")
        setFiles(null);
      } else {
        setMessage("Failed to upload file.");
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
      setMessage("An error occurred during upload.");
    } finally {
      setUploading(false);
      // router.push("/voice-interview");
    }
  };
  const handleDeleteResume = async (resumeId: string) => {
    console.log(resumeId);
    try {
      const res = await fetch("/api/resume", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resume_id: resumeId }),
      });

      const data = await res.json();
      // console.log(data)
      if (res.ok && data.success) {
        // Remove the deleted resume from the state
        setSessions((prevSessions) =>
          prevSessions.filter((session) => session._id !== resumeId)
        );

        toast.success("Session Removed Successfully", { duration: 2000 });
      } else {
        setMessage(data.message || "Failed to delete resume.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error("Error deleting resume: " + error.message, {
          duration: 2000,
        });
      }
    }
  };
  const fetchInterviews = async () => {
      try {
        const res = await fetch(`/api/resume`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data?.message || "Something went wrong");
          return;
        }

        if (data?.data?.length === 0) {
          setSessions([]);
          toast.error("No interview sessions found", { icon: "📭" });
          return;
        }

        setSessions(data.data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          // console.error("Failed to load sessions", err.message);
          toast.error(`Failed to load interview sessions: ${err.message}`);
        } else {
          // console.error("Failed to load sessions", err);
          toast.error("Failed to load interview sessions. Please try again.");
        }
      }
    };
  useEffect(() => {
    
    fetchInterviews();
  }, []);

  const handleEvaluate = async (sessionId: string) => {
    setEvaluating(sessionId);
    toast(`Evaluating session ${sessionId}…`);

    try {
      const res = await fetch("/api/conversation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Evaluation failed");
      }

      toast.success("Session evaluated successfully");
      fetchInterviews(); // refresh sessions list
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`Eval error: ${err.message}`);
      } else {
        toast.error("Eval error: Unknown error");
      }
    } finally {
      setEvaluating(null);
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="scroll-m-20 border-b whitespace-pre-line pb-2 text-center text-4xl font-extrabold  tracking-tight lg:text-5xl">
          Intervue
        </h1>
        <section className="flex-col justify-between mt-5">
          <div className="flex items-center justify-between">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              InterViews
            </h3>
            <div className="flex items-center gap-4 p-2.5">
              <Dialog>
                <Button
                  className="cursor-pointer"
                  onClick={() => {
                    fetchInterviews();
                  }}
                >
                  <RefreshCcw />
                  refresh
                </Button>
                <DialogTrigger className="border px-2 cursor-pointer py-1 rounded-sm text-xl">
                  + New Interview
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Resume</DialogTitle>
                  </DialogHeader>
                  <FileUpload onChange={handleFileUpload} />
                  <Button onClick={handleUpload} disabled={uploading || !files}>
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                  {message ? (
                    <DialogDescription
                      style={{
                        marginTop: 16,
                        color: message.includes("success") ? "green" : "red",
                      }}
                    >
                      {message}
                    </DialogDescription>
                  ) : (
                    <DialogDescription>upload your file here</DialogDescription>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div>
            <Table className="border rounded-sm">
              {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
              <TableHeader>
                <TableRow>
                  <TableHead className="">Title</TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead>Creation Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions &&
                  sessions?.map((session) => (
                    <TableRow key={session._id}>
                      <TableCell className="font-medium">
                        {session.sessionTitle}
                      </TableCell>
                      <TableCell>{session.resumeName}</TableCell>
                      <TableCell>
                        {session.createdAt
                          ? new Date(session.createdAt).toLocaleString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : ""}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex justify-end items-center gap-2">
                          {session?.conversation.length > 0 ? (
                            <>
                              {session.isEvaluated ? (
                                <>
                                  <Button
                                    className="cursor-pointer"
                                    onClick={() => {
                                      router.push(
                                        `/interview/${session._id}/dashboard`
                                      );
                                    }}
                                  >
                                    Dashboard
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    className={`cursor-pointer ${
                                      evaluating === session._id
                                        ? "bg-green-500 hover:bg-green-600"
                                        : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                    onClick={() => handleEvaluate(session._id)}
                                    disabled={evaluating === session._id}
                                  >
                                    {evaluating === session._id
                                      ? "Evaluating…"
                                      : "Evaluate"}
                                  </Button>
                                </>
                              )}
                              {/* remove resume by session._id */}
                              <Trash2
                                className="cursor-pointer"
                                onClick={() => handleDeleteResume(session._id)}
                              />
                            </>
                          ) : (
                            <>
                              <Button
                                className="cursor-pointer"
                                onClick={() => {
                                  router.push(
                                    `interview/${session._id}/playground`
                                  );
                                }}
                              >
                                Start Interview
                              </Button>
                              <Trash2
                                className="cursor-pointer "
                                onClick={() => handleDeleteResume(session._id)}
                              />
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
              {/* <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">$2,500.00</TableCell>
                </TableRow>
              </TableFooter> */}
            </Table>
          </div>
        </section>
      </div>
    </>
  );
}
