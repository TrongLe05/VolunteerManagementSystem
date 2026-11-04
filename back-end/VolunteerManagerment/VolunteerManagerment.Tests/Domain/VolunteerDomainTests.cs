using FluentAssertions;
using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Domain.Exceptions;
using Xunit;

namespace VolunteerManagerment.Tests.Domain;

public class VolunteerDomainTests
{
    [Fact]
    public void NewVolunteer_ShouldEnforcePrivacyByDesignDefaults_PerDecree13()
    {
        var volunteer = new Volunteer();

        volunteer.Should().BeAssignableTo<BaseEntity>();
        volunteer.Should().BeAssignableTo<IAuditableEntity>();
        volunteer.Id.Should().NotBeEmpty();
        volunteer.IsActive.Should().BeTrue();
        volunteer.ConsentFaceAuth.Should().BeFalse("theo Nghị định 13/2023/NĐ-CP, mặc định không tự động bật sinh trắc học nếu chưa có sự đồng ý");
        volunteer.ConsentGivenAt.Should().BeNull();
        volunteer.Registrations.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void ApplyFaceBiometricConsent_ShouldRecordTimestampOnGrant_PreserveOriginalTimestampOnReGrant_AndClearOnRevoke()
    {
        var volunteer = new Volunteer();
        var firstGrantTime = DateTimeOffset.UtcNow;

        volunteer.ApplyFaceBiometricConsent(true, firstGrantTime);
        volunteer.ConsentFaceAuth.Should().BeTrue();
        volunteer.ConsentGivenAt.Should().Be(firstGrantTime);
        volunteer.UpdatedAt.Should().Be(firstGrantTime);

        // Cấp lại khi đã đồng ý trước đó -> Giữ nguyên mốc thời gian đồng ý ban đầu
        var secondUpdateTime = firstGrantTime.AddMinutes(30);
        volunteer.ApplyFaceBiometricConsent(true, secondUpdateTime);
        volunteer.ConsentFaceAuth.Should().BeTrue();
        volunteer.ConsentGivenAt.Should().Be(firstGrantTime);
        volunteer.UpdatedAt.Should().Be(secondUpdateTime);

        // Rút lại sự đồng ý -> Xoá mốc thời gian
        var revokeTime = firstGrantTime.AddHours(1);
        volunteer.ApplyFaceBiometricConsent(false, revokeTime);
        volunteer.ConsentFaceAuth.Should().BeFalse();
        volunteer.ConsentGivenAt.Should().BeNull();
        volunteer.UpdatedAt.Should().Be(revokeTime);
    }

    [Fact]
    public void EnsureEligibleForActivityRegistration_ShouldValidateActiveStatusAndStudentCode()
    {
        var eligibleVolunteer = new Volunteer { IsActive = true, StudentCode = "0022410001" };
        eligibleVolunteer.Invoking(v => v.EnsureEligibleForActivityRegistration()).Should().NotThrow();

        var inactiveVolunteer = new Volunteer { IsActive = false, StudentCode = "0022410001" };
        inactiveVolunteer.Invoking(v => v.EnsureEligibleForActivityRegistration())
            .Should().Throw<UnauthorizedAccessException>()
            .WithMessage("*đang bị khoá*");

        var missingMssvVolunteer = new Volunteer { IsActive = true, StudentCode = "   " };
        missingMssvVolunteer.Invoking(v => v.EnsureEligibleForActivityRegistration())
            .Should().Throw<DomainException>()
            .WithMessage("*Mã số sinh viên (MSSV)*");
    }

    [Fact]
    public void InheritFromImportedRecord_ShouldPopulateOnlyEmptyFields_AndNotOverwriteExistingFields()
    {
        var importedOrgId = Guid.NewGuid();
        var existingOrgId = Guid.NewGuid();
        var imported = new Volunteer
        {
            ClassName = "ĐHCNTT22A",
            DateOfBirth = new DateOnly(2004, 5, 10),
            Phone = "0912345678",
            Gender = "MALE",
            OrganizationId = importedOrgId
        };

        // Trường hợp 1: Hồ sơ hiện tại chưa có thông tin -> kế thừa toàn bộ
        var emptyVolunteer = new Volunteer { OrganizationId = Guid.Empty };
        emptyVolunteer.InheritFromImportedRecord(imported);
        emptyVolunteer.ClassName.Should().Be("ĐHCNTT22A");
        emptyVolunteer.DateOfBirth.Should().Be(new DateOnly(2004, 5, 10));
        emptyVolunteer.Phone.Should().Be("0912345678");
        emptyVolunteer.Gender.Should().Be("MALE");
        emptyVolunteer.OrganizationId.Should().Be(importedOrgId);

        // Trường hợp 2: Hồ sơ hiện tại đã có sẵn thông tin -> không bị ghi đè
        var existingVolunteer = new Volunteer
        {
            ClassName = "ĐHCNTT22B",
            DateOfBirth = new DateOnly(2003, 1, 1),
            Phone = "0999888777",
            Gender = "FEMALE",
            OrganizationId = existingOrgId
        };
        existingVolunteer.InheritFromImportedRecord(imported);
        existingVolunteer.ClassName.Should().Be("ĐHCNTT22B");
        existingVolunteer.DateOfBirth.Should().Be(new DateOnly(2003, 1, 1));
        existingVolunteer.Phone.Should().Be("0999888777");
        existingVolunteer.Gender.Should().Be("FEMALE");
        existingVolunteer.OrganizationId.Should().Be(existingOrgId);

        // Trường hợp 3: Truyền null -> ném ArgumentNullException
        var actNull = () => existingVolunteer.InheritFromImportedRecord(null!);
        actNull.Should().Throw<ArgumentNullException>();
    }
}
