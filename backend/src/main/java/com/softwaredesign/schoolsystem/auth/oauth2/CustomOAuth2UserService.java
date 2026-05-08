package com.softwaredesign.schoolsystem.auth.oauth2;

import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(request);
        GoogleOAuth2UserInfo userInfo = new GoogleOAuth2UserInfo(oAuth2User.getAttributes());

        User user = userRepository.findByGoogleId(userInfo.getId())
                .orElseGet(() -> userRepository.findByEmail(userInfo.getEmail())
                        .map(existing -> {
                            // 이메일로 미리 등록된 계정이면 google_id 연결
                            existing.linkGoogleId(userInfo.getId());
                            return existing;
                        })
                        .orElseGet(() -> userRepository.save(
                                User.createNewUser(userInfo.getEmail(), userInfo.getId())
                        )));

        return new CustomOAuth2User(user, oAuth2User.getAttributes());
    }
}
