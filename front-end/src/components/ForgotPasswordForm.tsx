import { cn } from "@/lib/utils";
import { FieldGroup, FieldLabel, Field } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { toast } from "./ui/toaster";

export const ForgotPasswordForm = ({
  className,
  ...props
}: React.ComponentProps<"form">) => {
  const { forgotPassword } = useAuth();
  const navigation = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      // Simulate an API call
      await toast.promise(forgotPassword(email), {
        loading: "Đang gửi yêu cầu...",
        success: "Gửi yêu cầu thành công! Vui lòng kiểm tra email của bạn.",
        error: (err: unknown) => {
          if (axios.isAxiosError(err)) {
            const data = err.response?.data;
            return (
              data?.message ||
              data?.detail ||
              data?.title ||
              "Gửi yêu cầu thất bại. Vui lòng thử lại."
            );
          }
          return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại máy chủ.";
        },
      });
      navigation("/change-password", { state: { email } });
    } catch {
      // Error handling is already done in the toast.promise, so we don't need to do anything here.
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={onSubmit}
    >
      <FieldGroup>
        <div className="flex flex-col items-start gap-1 text-center">
          <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
          <p className="text-sm text-start text-muted-foreground">
            Nhập địa chỉ email đã đăng ký, chúng tôi sẽ gửi đường dẫn đặt lại
            mật khẩu.
          </p>
        </div>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="email">Địa chỉ email</FieldLabel>
            <Link
              to="/login"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Đăng nhập
            </Link>
          </div>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
          ></Input>
        </Field>
        <Field>
          <Button type="submit" disabled={isSubmitting}>
            Gửi yêu cầu
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
};
