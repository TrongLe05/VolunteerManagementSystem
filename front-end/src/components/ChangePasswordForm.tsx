import { useState, type FormEvent } from "react";
import { FieldGroup } from "@/components/ui/field";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/toaster";
export const ChangePasswordForm = ({
  className,
  ...props
}: React.ComponentProps<"form">) => {
  const { resetPassword } = useAuth();
  const location = useLocation();
  const navigation = useNavigate();

  const { email, otp } = location.state || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await resetPassword(email, otp, password, confirmPassword);
      toast.success(
        "Đổi mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.",
      );
      navigation("/login", {
        state: { registeredEmail: email },
      });
    } catch {
      toast.error(
        "Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau hoặc liên hệ với bộ phận hỗ trợ.",
      );
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Đổi mật khẩu</CardTitle>
          <CardDescription>
            Nhập mật khẩu mới của bạn để thay đổi mật khẩu hiện tại.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Mật khẩu mới</FieldLabel>
              </div>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
              ></Input>
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="confirmPassword">
                  Xác nhận mật khẩu
                </FieldLabel>
              </div>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu"
              ></Input>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Field>
            <Button type="submit" disabled={isSubmitting}>
              Gửi yêu cầu
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </form>
  );
};
