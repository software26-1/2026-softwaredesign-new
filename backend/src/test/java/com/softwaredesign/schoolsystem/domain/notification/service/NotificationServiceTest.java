package com.softwaredesign.schoolsystem.domain.notification.service;

import com.softwaredesign.schoolsystem.domain.notification.dto.NotificationResponse;
import com.softwaredesign.schoolsystem.domain.notification.entity.Notification;
import com.softwaredesign.schoolsystem.domain.notification.entity.NotificationEventType;
import com.softwaredesign.schoolsystem.domain.notification.repository.NotificationRepository;
import com.softwaredesign.schoolsystem.domain.notification.sender.NotificationDispatcher;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService 단위 테스트")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationDispatcher dispatcher;

    @InjectMocks
    private NotificationService notificationService;

    private static final Long RECIPIENT_ID = 50L;

    private User recipient;

    @BeforeEach
    void setUp() {
        recipient = org.mockito.Mockito.mock(User.class);
        lenient().when(recipient.getId()).thenReturn(RECIPIENT_ID);
        lenient().when(recipient.getEmail()).thenReturn("user@x.com");
    }

    @Test
    @DisplayName("알림 생성 시 저장하고 외부 디스패처를 호출한다")
    void create_savesAndDispatches() {
        given(userRepository.findById(RECIPIENT_ID)).willReturn(Optional.of(recipient));

        NotificationResponse response = notificationService.create(
                RECIPIENT_ID, NotificationEventType.GRADE_UPDATE, "성적 변경", "성적이 변경되었습니다.");

        assertThat(response.getTitle()).isEqualTo("성적 변경");
        assertThat(response.getEventType()).isEqualTo(NotificationEventType.GRADE_UPDATE);
        verify(notificationRepository).save(any(Notification.class));
        verify(dispatcher).dispatch(eq(recipient), eq("성적 변경"), eq("성적이 변경되었습니다."));
    }

    @Test
    @DisplayName("수신자를 찾을 수 없으면 IllegalArgumentException 발생")
    void create_recipientNotFound() {
        given(userRepository.findById(RECIPIENT_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.create(
                RECIPIENT_ID, NotificationEventType.FEEDBACK, "t", "m"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("수신자");
    }

    @Test
    @DisplayName("디스패처가 실패해도 알림은 저장되고 예외가 전파되지 않는다")
    void create_dispatchFailureSwallowed() {
        given(userRepository.findById(RECIPIENT_ID)).willReturn(Optional.of(recipient));
        doThrow(new RuntimeException("SES down")).when(dispatcher).dispatch(any(), anyString(), anyString());

        NotificationResponse response = notificationService.create(
                RECIPIENT_ID, NotificationEventType.APPROVAL, "t", "m");

        assertThat(response).isNotNull();
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("notify 헬퍼는 create 를 호출해 알림을 저장한다")
    void notify_delegatesToCreate() {
        given(userRepository.findById(RECIPIENT_ID)).willReturn(Optional.of(recipient));

        notificationService.notify(RECIPIENT_ID, NotificationEventType.COUNSELING, "t", "m");

        verify(notificationRepository).save(any(Notification.class));
        verify(dispatcher).dispatch(eq(recipient), eq("t"), eq("m"));
    }

    @Test
    @DisplayName("isRead 필터가 null 이면 전체 알림을 조회한다")
    void getByUser_allWhenNull() {
        Notification n = Notification.create(recipient, NotificationEventType.FEEDBACK, "t", "m");
        given(notificationRepository.findByRecipientId(RECIPIENT_ID)).willReturn(List.of(n));

        List<NotificationResponse> result = notificationService.getByUser(RECIPIENT_ID, null);

        assertThat(result).hasSize(1);
        verify(notificationRepository).findByRecipientId(RECIPIENT_ID);
    }

    @Test
    @DisplayName("isRead 필터가 주어지면 읽음 상태로 조회한다")
    void getByUser_filtersByReadFlag() {
        Notification n = Notification.create(recipient, NotificationEventType.FEEDBACK, "t", "m");
        given(notificationRepository.findByRecipientIdAndIsRead(RECIPIENT_ID, false)).willReturn(List.of(n));

        List<NotificationResponse> result = notificationService.getByUser(RECIPIENT_ID, false);

        assertThat(result).hasSize(1);
        verify(notificationRepository).findByRecipientIdAndIsRead(RECIPIENT_ID, false);
    }

    @Test
    @DisplayName("본인 알림을 읽음 처리하면 isRead 가 true 가 된다")
    void markRead_success() {
        Notification n = Notification.create(recipient, NotificationEventType.FEEDBACK, "t", "m");
        given(notificationRepository.findById(1L)).willReturn(Optional.of(n));

        NotificationResponse response = notificationService.markRead(1L, RECIPIENT_ID);

        assertThat(response.isRead()).isTrue();
    }

    @Test
    @DisplayName("존재하지 않는 알림 읽음 처리 시 IllegalArgumentException 발생")
    void markRead_notFound() {
        given(notificationRepository.findById(1L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markRead(1L, RECIPIENT_ID))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("타인의 알림을 읽음 처리하면 AccessDeniedException 발생")
    void markRead_notOwner() {
        Notification n = Notification.create(recipient, NotificationEventType.FEEDBACK, "t", "m");
        given(notificationRepository.findById(1L)).willReturn(Optional.of(n));

        assertThatThrownBy(() -> notificationService.markRead(1L, 999L))
                .isInstanceOf(AccessDeniedException.class);
    }
}
