package com.softwaredesign.schoolsystem.auth.oauth2;

import com.softwaredesign.schoolsystem.auth.jwt.JwtProvider;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.entity.UserStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        User user = oAuth2User.getUser();

        String accessToken = jwtProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole());
        String redirectUrl;

        if (user.getStatus() == UserStatus.PENDING) {
            // 신규 유저: 임시 JWT만 발급하고 프로필 설정 페이지로
            redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth/callback")
                    .queryParam("isNewUser", "true")
                    .queryParam("tempToken", accessToken)
                    .build().toUriString();
        } else if (user.getStatus() == UserStatus.WAITING_APPROVAL) {
            // 승인 대기 중: 승인 대기 페이지로
            redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth/callback")
                    .queryParam("status", "waiting_approval")
                    .build().toUriString();
        } else if (user.getStatus() == UserStatus.INACTIVE) {
            // 비활성화된 계정: 로그인 불가
            redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth/callback")
                    .queryParam("status", "inactive")
                    .build().toUriString();
        } else {
            // 기존 유저: access + refresh 발급
            String refreshToken = jwtProvider.createRefreshToken();
            String hashedToken = jwtProvider.hashToken(refreshToken);
            long ttl = jwtProvider.getRefreshExpiration();

            // RT:{hash} → userId: refresh 시 사용
            redisTemplate.opsForValue().set("RT:" + hashedToken, String.valueOf(user.getId()), Duration.ofMillis(ttl));
            // RTU:{userId} → hash: logout 시 사용
            redisTemplate.opsForValue().set("RTU:" + user.getId(), hashedToken, Duration.ofMillis(ttl));

            String userJson = String.format(
                    "{\"id\":%d,\"email\":\"%s\",\"name\":\"%s\",\"role\":\"%s\",\"status\":\"%s\"}",
                    user.getId(), user.getEmail(),
                    user.getName() != null ? user.getName() : "",
                    user.getRole() != null ? user.getRole().name() : "",
                    user.getStatus().name()
            );

            String encodedUser = URLEncoder.encode(userJson, StandardCharsets.UTF_8);
            redirectUrl = frontendUrl + "/oauth/callback"
                    + "?accessToken=" + accessToken
                    + "&refreshToken=" + refreshToken
                    + "&user=" + encodedUser;
        }

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
