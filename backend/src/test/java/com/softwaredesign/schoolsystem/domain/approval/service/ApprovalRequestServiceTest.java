package com.softwaredesign.schoolsystem.domain.approval.service;

import com.softwaredesign.schoolsystem.domain.approval.dto.ApprovalCreateRequest;
import com.softwaredesign.schoolsystem.domain.approval.dto.ApprovalResponse;
import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalRequest;
import com.softwaredesign.schoolsystem.domain.approval.entity.ApprovalStatus;
import com.softwaredesign.schoolsystem.domain.approval.entity.RequestType;
import com.softwaredesign.schoolsystem.domain.approval.repository.ApprovalRequestRepository;
import com.softwaredesign.schoolsystem.domain.notification.entity.NotificationEventType;
import com.softwaredesign.schoolsystem.domain.notification.service.NotificationService;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import com.softwaredesign.schoolsystem.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("ApprovalRequestService 단위 테스트")
class ApprovalRequestServiceTest {

    @Mock
    private ApprovalRequestRepository approvalRequestRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ApprovalRequestService approvalRequestService;

    private static final Long REQUESTER_ID = 50L;
    private static final Long APPROVER_ID = 60L;

    private User requester;
    private User approver;

    @BeforeEach
    void setUp() {
        requester = org.mockito.Mockito.mock(User.class);
        lenient().when(requester.getId()).thenReturn(REQUESTER_ID);
        lenient().when(requester.getName()).thenReturn("요청자");
        approver = org.mockito.Mockito.mock(User.class);
        lenient().when(approver.getId()).thenReturn(APPROVER_ID);
    }

    private ApprovalCreateRequest createRequest() {
        ApprovalCreateRequest req = new ApprovalCreateRequest();
        ReflectionTestUtils.setField(req, "requestType", RequestType.STUDENT_TRANSFER);
        ReflectionTestUtils.setField(req, "requestDetail", "전학 요청");
        return req;
    }

    @Test
    @DisplayName("승인 요청을 생성하면 PENDING 상태로 저장된다")
    void create_success() {
        given(userRepository.findById(REQUESTER_ID)).willReturn(Optional.of(requester));

        ApprovalResponse response = approvalRequestService.create(createRequest(), REQUESTER_ID);

        assertThat(response.getStatus()).isEqualTo(ApprovalStatus.PENDING);
        assertThat(response.getRequestType()).isEqualTo(RequestType.STUDENT_TRANSFER);
        verify(approvalRequestRepository).save(any(ApprovalRequest.class));
    }

    @Test
    @DisplayName("요청자를 찾을 수 없으면 IllegalArgumentException 발생")
    void create_requesterNotFound() {
        given(userRepository.findById(REQUESTER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> approvalRequestService.create(createRequest(), REQUESTER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("사용자");
    }

    @Test
    @DisplayName("상태와 유형이 모두 주어지면 두 조건으로 조회한다")
    void getAll_byStatusAndType() {
        given(approvalRequestRepository.findByStatusAndRequestType(ApprovalStatus.PENDING, RequestType.CLASS_CHANGE))
                .willReturn(List.of());

        approvalRequestService.getAll(ApprovalStatus.PENDING, RequestType.CLASS_CHANGE);

        verify(approvalRequestRepository).findByStatusAndRequestType(ApprovalStatus.PENDING, RequestType.CLASS_CHANGE);
    }

    @Test
    @DisplayName("상태만 주어지면 상태로 조회한다")
    void getAll_byStatus() {
        given(approvalRequestRepository.findByStatus(ApprovalStatus.APPROVED)).willReturn(List.of());

        approvalRequestService.getAll(ApprovalStatus.APPROVED, null);

        verify(approvalRequestRepository).findByStatus(ApprovalStatus.APPROVED);
    }

    @Test
    @DisplayName("유형만 주어지면 유형으로 조회한다")
    void getAll_byType() {
        given(approvalRequestRepository.findByRequestType(RequestType.TEACHER_TRANSFER)).willReturn(List.of());

        approvalRequestService.getAll(null, RequestType.TEACHER_TRANSFER);

        verify(approvalRequestRepository).findByRequestType(RequestType.TEACHER_TRANSFER);
    }

    @Test
    @DisplayName("필터가 없으면 전체 조회한다")
    void getAll_noFilter() {
        given(approvalRequestRepository.findAll()).willReturn(List.of());

        approvalRequestService.getAll(null, null);

        verify(approvalRequestRepository).findAll();
    }

    @Test
    @DisplayName("승인 처리 시 상태가 갱신되고 요청자에게 알림이 전송된다")
    void process_notifiesRequester() {
        ApprovalRequest request = ApprovalRequest.create(requester, RequestType.STUDENT_TRANSFER, "전학");
        given(approvalRequestRepository.findById(1L)).willReturn(Optional.of(request));
        given(userRepository.findById(APPROVER_ID)).willReturn(Optional.of(approver));

        ApprovalResponse response = approvalRequestService.process(1L, ApprovalStatus.APPROVED, APPROVER_ID);

        assertThat(response.getStatus()).isEqualTo(ApprovalStatus.APPROVED);
        verify(notificationService).notify(
                eq(REQUESTER_ID),
                eq(NotificationEventType.APPROVAL),
                any(String.class),
                contains("APPROVED"));
    }

    @Test
    @DisplayName("존재하지 않는 승인 요청 처리 시 IllegalArgumentException 발생")
    void process_requestNotFound() {
        given(approvalRequestRepository.findById(1L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> approvalRequestService.process(1L, ApprovalStatus.APPROVED, APPROVER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("승인 요청");
    }

    @Test
    @DisplayName("승인자를 찾을 수 없으면 IllegalArgumentException 발생")
    void process_approverNotFound() {
        ApprovalRequest request = ApprovalRequest.create(requester, RequestType.STUDENT_TRANSFER, "전학");
        given(approvalRequestRepository.findById(1L)).willReturn(Optional.of(request));
        given(userRepository.findById(APPROVER_ID)).willReturn(Optional.empty());

        assertThatThrownBy(() -> approvalRequestService.process(1L, ApprovalStatus.APPROVED, APPROVER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("승인자");
    }
}
