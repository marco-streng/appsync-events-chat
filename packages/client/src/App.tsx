import { Amplify } from "aws-amplify";
import { events, type EventsChannel } from "aws-amplify/api";
import { useEffect, useRef, useState } from "react";
import "./App.css";

Amplify.configure({
  API: {
    Events: {
      endpoint: import.meta.env.VITE_API_ENDPOINT,
      region: "eu-central-1",
      defaultAuthMode: "apiKey",
      apiKey: import.meta.env.VITE_API_KEY,
    },
  },
});

type Event = {
  event: {
    kind: "status" | "message";
    text: string;
    author?: {
      id: string;
      name: string;
    };
  };
  id: string;
  type: string;
};

const ChatApp = () => {
  const chatRoom = window.location.pathname;
  const [user, setUser] = useState<{ name?: string; id: string }>({
    id: self.crypto.randomUUID(),
  });
  const [messages, setMessages] = useState<Event[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => {
    if (stageRef.current) {
      stageRef.current.scrollTop = stageRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    let channel: EventsChannel;

    const connectAndSubscribe = async () => {
      channel = await events.connect(`chat${chatRoom}`);

      channel.subscribe({
        next: (data: Event) => {
          setMessages((prev) => [...prev, data]);
        },
        error: (err) => console.error("error", err),
      });
    };

    connectAndSubscribe();

    inputRef.current?.focus();
    scrollDown();

    return () => channel && channel.close();
  }, [chatRoom]);

  useEffect(() => {
    scrollDown();
  }, [messages]);

  async function publishStatus(text: string) {
    await events.post(`chat${chatRoom}`, {
      text,
      kind: "status",
      author: {
        name: user.name ?? "unknown",
        id: user.id,
      },
    });
  }

  async function publishMessage(text: string) {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    await events.post(`chat${chatRoom}`, {
      text,
      kind: "message",
      author: {
        name: user.name ?? "unknown",
        id: user.id,
      },
    });

    inputRef.current?.focus();
  }

  if (!user.name) {
    return (
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const name = inputRef.current?.value;

          if (name && name.length > 0) {
            setUser((curr) => ({
              ...curr,
              name,
            }));

            publishStatus(`${name} entered the chat`);
          }
        }}
      >
        <div className="h-screen flex items-center justify-center gap-4">
          <input
            ref={inputRef}
            type="text"
            name="username"
            placeholder="Your name"
            className="bg-gray-200 text-3xl outline-0 rounded-full text-gray-800 px-12 py-6 w-full max-w-lg"
          />
          <button
            type="submit"
            className="rounded-full bg-blue-500 hover:bg-blue-800 cursor-pointer text-white flex items-center justify-center p-2 w-20 h-20"
          >
            <Icon className="size-12" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="w-full border-l border-r border-gray-200 relative">
      <div
        ref={stageRef}
        className="h-[calc(100vh-110px)] pt-8 px-8 overflow-y-auto"
      >
        {messages.map((message) =>
          message.event.kind === "message" ? (
            <Bubble
              key={message.id}
              author={message.event.author!.name}
              isSelf={user.id === message.event.author!.id}
              text={message.event.text}
            />
          ) : (
            <p className="text-gray-500 mb-8 text-sm text-center">
              {message.event.text}
            </p>
          )
        )}
      </div>
      <div className="fixed bottom-0 h-[110px] bg-gray-200 px-8 w-full flex items-center ">
        <div className="w-full">
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const message = inputRef.current?.value;

              if (message && message.length > 0) {
                await publishMessage(message);
              }
            }}
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                name="message"
                className="bg-white outline-0 rounded-full w-full text-gray-800 px-6 py-3 grow"
              />
              <button
                type="submit"
                className="rounded-full bg-blue-500 hover:bg-blue-800 cursor-pointer text-white flex items-center justify-center p-2 w-12 h-12"
              >
                <Icon className="size-6" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Bubble = ({
  author,
  text,
  isSelf,
}: {
  author: string;
  text: string;
  isSelf: boolean;
}) => (
  <div
    className={`flex items-start gap-2 mb-4 ${
      isSelf ? "flex-row-reverse" : ""
    }`}
  >
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
        isSelf ? "bg-blue-800 " : "bg-gray-800 "
      }`}
    >
      <strong>{author.substring(0, 1)}</strong>
    </div>

    <div
      className={`flex flex-col w-full max-w-[400px] p-4 border-gray-200  ${
        isSelf
          ? "rounded-tl-xl rounded-b-xl bg-blue-100"
          : "rounded-tr-xl rounded-b-xl bg-gray-100"
      }`}
    >
      <div className="flex items-center">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {author}
        </span>
      </div>
      <p className="text-sm font-normal py-2 text-gray-900 dark:text-white">
        {text}
      </p>
    </div>
  </div>
);

const Icon = ({ className }: { className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
    />
  </svg>
);

export default ChatApp;
