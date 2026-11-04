import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { useState, type FormEvent } from "react";
import axios from "axios";
import { toast } from "./ui/toaster";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as {
    from?: { pathname: string };
    registeredEmail?: string;
  };

  const from = locationState?.from?.pathname || "/";

  const registeredEmail = locationState?.registeredEmail;

  const [usernameOrEmail, setUsernameOrEmail] = useState<string>(
    registeredEmail || "",
  );

  const [password, setPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ usernameOrEmail, password });
      navigate(from, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // Đọc thông báo lỗi từ ExceptionHandlingMiddleware của Backend .NET
        const data = err.response?.data;
        const message =
          data?.message ||
          data?.detail ||
          data?.title ||
          "Tài khoản hoặc mật khẩu không chính xác.";
        toast.error(message);
      } else {
        toast.error("Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-center text-center">
        <CardTitle className="text-xl font-bold">Đăng nhập</CardTitle>
        <CardDescription>
          Nhập email hoặc tên đăng nhập và mật khẩu để tiếp tục.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className={cn("flex flex-col gap-6", className)}
          {...props}
          onSubmit={onSubmit}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email hoặc tên đăng nhập</FieldLabel>
              <Input
                id="email"
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="m@example.com"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <Link
                  to="/forgot-password"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </Field>
            <FieldSeparator>Hoặc tiếp tục với</FieldSeparator>
            <Field>
              <Button variant="outline" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                    fill="currentColor"
                  />
                </svg>
                Đăng nhập với GitHub
              </Button>
              <FieldDescription className="text-center">
                Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
