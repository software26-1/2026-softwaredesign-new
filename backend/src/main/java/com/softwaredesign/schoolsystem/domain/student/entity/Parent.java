package com.softwaredesign.schoolsystem.domain.student.entity;

import com.softwaredesign.schoolsystem.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class Parent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    public static Parent createParent(User user) {
        Parent parent = new Parent();

        parent.user = user;

        return parent;
    }
}