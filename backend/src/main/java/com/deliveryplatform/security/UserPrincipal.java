package com.deliveryplatform.security;

import com.deliveryplatform.domain.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.UUID;

/**
 * Custom UserDetails implementation to decouple the domain Entity from Spring Security.
 */
@Getter
public class UserPrincipal implements UserDetails {
    private final UUID id;
    private final String email;
    private final String password;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;
    private final User user; // Reference to domain entity if needed

    public UserPrincipal(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        // Use the authoritative enabled check which accounts for status and deletion
        this.active = user.isEnabled();
        this.authorities = java.util.Arrays.asList(
            new SimpleGrantedAuthority(user.getRole().toAuthorityName()),
            new SimpleGrantedAuthority(user.getRole().name())
        );
        this.user = user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }

    /**
     * Safely retrieves the associated agency ID.
     * Throws UnauthorizedException if the user has no agency.
     */
    public UUID getRequiredAgencyId() {
        if (user.getAgency() == null) {
            throw new com.deliveryplatform.exception.UnauthorizedException("User is not associated with any agency.");
        }
        return user.getAgency().getId();
    }
}
