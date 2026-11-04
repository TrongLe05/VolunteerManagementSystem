using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;

namespace VolunteerManagerment.Application.Common.Behaviors;

public class DashboardNotificationBehavior<TRequest, TResponse>(
    IDashboardNotificationService? notificationService = null
) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var response = await next();

        if (notificationService == null)
        {
            return response;
        }

        try
        {
            var fullName = typeof(TRequest).FullName ?? string.Empty;

            if (fullName.Contains(".Commands."))
            {
                if (fullName.Contains(".Features.Activities."))
                {
                    await notificationService.NotifyActivityChangedAsync(cancellationToken);
                }
                else if (fullName.Contains(".Features.Campaigns."))
                {
                    await notificationService.NotifyCampaignChangedAsync(cancellationToken);
                }
                else if (fullName.Contains(".Features.Organizations."))
                {
                    await notificationService.NotifyOrganizationChangedAsync(cancellationToken);
                }
                else if (fullName.Contains(".Features.Volunteers."))
                {
                    await notificationService.NotifyVolunteerChangedAsync(cancellationToken);
                }
            }
        }
        catch
        {
            // Do not fail command response if notification dispatch encounters an error
        }

        return response;
    }
}
