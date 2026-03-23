# Option 2: Application-Level IP Filtering

This approach uses your existing Spring Boot application to handle the IP restrictions directly without needing to split deployments or configure an external proxy.

## How it works
Your Java backend inspects the IP address of every incoming request. If the request is trying to access an admin path (`/api/principal/*`, `/api/hod/*`, `/api/faculty/*`) and the IP does NOT match the college's public static IP, the backend rejects it with a `403 Forbidden` error. Student paths (`/api/student/*`) remain open to everyone.

### Architecture changes:
- **Backend:** Update `WebSecurityConfig.java` and add a custom IP Filter.
- **Frontend:** Update `api.js` interceptors to catch `403` errors and display a toast message like: *"Access Denied: You must be on the College network to access this dashboard."*

## Implementation Plan

### Step 1: Add College IPs to Configuration
In your `backend-springboot/src/main/resources/application.properties`, define the allowed IPs:
```properties
# Comma-separated list of allowed IPs for Admin/Faculty access
# Example: 192.168.1.0/24 for local intranet testing, and your public IP
app.security.college-ips=127.0.0.1,0:0:0:0:0:0:0:1,192.168.1.0/24,203.0.113.50
```

### Step 2: Create a Custom IP Authorization Manager
In Spring Security 6+, we create an `AuthorizationManager` to check IPs.

```java
// src/main/java/com/example/ia/security/IpAuthorizationManager.java
package com.example.ia.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;

import java.util.Arrays;
import java.util.List;
import java.util.function.Supplier;

@Component
public class IpAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    @Value("${app.security.college-ips}")
    private String allowedIpsProperty;

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication, RequestAuthorizationContext context) {
        String remoteAddress = context.getRequest().getRemoteAddr();
        // Fallback for load balancers
        String forwardedFor = context.getRequest().getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            remoteAddress = forwardedFor.split(",")[0].trim();
        }

        List<String> allowedIps = Arrays.asList(allowedIpsProperty.split(","));
        
        // Simple exact match check. For subnet support (/24), an IPAddressMatcher would be used here.
        boolean isAllowed = allowedIps.contains(remoteAddress);
        
        return new AuthorizationDecision(isAllowed);
    }
}
```

### Step 3: Update `WebSecurityConfig.java`
Inject the `IpAuthorizationManager` and apply it to the specific API paths.

```java
@Autowired
private IpAuthorizationManager ipAuthorizationManager;

@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // ... existing config ...
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/student/**", "/api/marks/my-marks").permitAll()
            // ENFORCE IP RULES FOR THESE PATHS
            .requestMatchers("/api/principal/**", "/api/hod/**", "/api/faculty/**")
                .access(ipAuthorizationManager)
            .anyRequest().authenticated()
        );
        
    return http.build();
}
```

### Step 4: Frontend Handling
Finally, handle the error gracefully on the frontend. In `src/services/api.js` or in your login catch blocks, check for `403` status codes and alert the user.

```javascript
if (response.status === 403) {
    alert("Security Alert: You can only access this dashboard from the College Network.");
    logout();
}
```

## Pros and Cons of this Approach
**Pros:** 
- Extremely fast to implement (takes ~15 minutes).
- Requires zero infrastructure changes (no new servers, no moving databases).
- Free.

**Cons:**
- Relies on the College having a **static public IP address**. If the college IP changes daily, this will lock out legitimate faculty until the properties file is updated.
- You must carefully pass `X-Forwarded-For` headers if deploying behind Cloudflare or AWS Load Balancers.
