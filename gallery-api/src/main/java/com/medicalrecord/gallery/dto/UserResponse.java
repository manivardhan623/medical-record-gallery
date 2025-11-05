package com.medicalrecord.gallery.dto;

import com.medicalrecord.gallery.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long userId;
    private String name;
    private String email;
    private String googleId;
    private String userType;
    private String accessCode;
    private Boolean isVerified;

    public static UserResponse fromUser(User user) {
        return new UserResponse(
            user.getUserId(),
            user.getName(),
            user.getEmail(),
            user.getGoogleId(),
            user.getUserType().toString(),
            user.getAccessCode(),
            user.getIsVerified()
        );
    }
}
