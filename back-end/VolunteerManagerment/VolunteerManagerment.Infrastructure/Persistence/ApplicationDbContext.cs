using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<Volunteer> Volunteers => Set<Volunteer>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<ActivityLocation> ActivityLocations => Set<ActivityLocation>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("user_roles");
            entity.HasKey(ur => new { ur.UserId, ur.RoleId });

            entity.HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");

            entity.HasIndex(rt => rt.Token).IsUnique();

            entity.HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.ToTable("password_reset_tokens");
            entity.HasOne(rt => rt.User)
                  .WithMany()
                  .HasForeignKey(rt => rt.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Volunteer>(entity =>
        {
            entity.ToTable("volunteers");
            entity.HasIndex(v => v.VolunteerCode).IsUnique();
            entity.HasOne(v => v.User)
                .WithOne()
                .HasForeignKey<Volunteer>(v => v.UserId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(v => v.Organization)
                .WithMany()
                .HasForeignKey(v => v.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Campaign>(entity =>
        {
            entity.ToTable("campaigns");
            entity.Property(c => c.Name).HasMaxLength(255).IsRequired();
            entity.Property(c => c.Status).HasMaxLength(30).IsRequired().HasDefaultValue("DRAFT");
            entity.Property(c => c.Description).IsRequired(false);
            entity.HasOne(c => c.Organization)
                .WithMany(o => o.Campaigns)
                .HasForeignKey(c => c.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(c => c.Creator)
                .WithMany(u => u.Campaigns)
                .HasForeignKey(c => c.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Activity>(entity =>
        {
            entity.ToTable("activities");
            entity.Property(a => a.Name).HasMaxLength(255).IsRequired();
            entity.Property(a => a.Status).HasMaxLength(30).IsRequired().HasDefaultValue("DRAFT");
            entity.Property(a => a.CreditHours).HasPrecision(4, 2);
            entity.Property(a => a.CreditDays).HasPrecision(3, 1);
            entity.HasOne(a => a.Campaign)
                .WithMany(c => c.Activities)
                .HasForeignKey(a => a.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(a => a.Creator)
                .WithMany()
                .HasForeignKey(a => a.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ActivityLocation>(entity =>
        {
            entity.ToTable("activity_locations");
            entity.Property(al => al.Name).HasMaxLength(255).IsRequired();
            entity.Property(al => al.Latitude).HasPrecision(10, 7);
            entity.Property(al => al.Longitude).HasPrecision(10, 7);
            entity.Property(al => al.AllowedRadiusMeters).HasPrecision(10, 2).HasDefaultValue(100.0m);
            entity.HasOne(al => al.Activity)
                .WithMany(a => a.Locations)
                .HasForeignKey(al => al.ActivityId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Organization>().ToTable("organizations");
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<Role>().ToTable("roles");
    }
}
