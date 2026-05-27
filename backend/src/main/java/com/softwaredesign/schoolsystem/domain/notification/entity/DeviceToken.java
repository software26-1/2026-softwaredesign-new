package com.softwaredesign.schoolsystem.domain.notification.entity;

import com.softwaredesign.schoolsystem.common.entity.BaseEntity;
import com.softwaredesign.schoolsystem.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * A single FCM registration token belonging to a user's device.
 *
 * <p>The {@code token} column is globally unique — FCM tokens are device+app
 * scoped — so re-registration of the same token updates the owning user/platform
 * rather than inserting a duplicate.
 */
@Entity
@Table(name = "device_token")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DeviceToken extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 512, unique = true)
    private String token;

    @Column(length = 20)
    private String platform;

    public static DeviceToken create(User user, String token, String platform) {
        DeviceToken deviceToken = new DeviceToken();
        deviceToken.user = user;
        deviceToken.token = token;
        deviceToken.platform = platform;
        return deviceToken;
    }

    /** Re-points an existing token row to (possibly) a new owner/platform on re-registration. */
    public void reassign(User user, String platform) {
        this.user = user;
        this.platform = platform;
    }
}
